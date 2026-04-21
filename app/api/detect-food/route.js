import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("file");

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing in environment variables" },
        { status: 500 },
      );
    }

    const imageParts = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString("base64");
        return {
          inlineData: {
            mimeType: file.type || "image/jpeg",
            data: base64Image,
          },
        };
      }),
    );

    const payload = {
      contents: [
        {
          parts: [
            {
              text: 'Analyze these images and identify all visible food items. Return ONLY a valid JSON array of string names for the food items detected. E.g., ["Apple", "Grilled Chicken", "Rice"]. Do NOT output any markdown blocks (e.g. ```json). Do NOT add conversational text.',
            },
            ...imageParts,
          ],
        },
      ],
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return NextResponse.json(
        { error: data.error?.message || "Error calling Gemini API" },
        { status: response.status },
      );
    }

    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textOutput) {
      return NextResponse.json(
        { error: "No valid response from Gemini" },
        { status: 500 },
      );
    }

    let detectedNames = [];
    try {
      const cleanedText = textOutput
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      detectedNames = JSON.parse(cleanedText);

      if (!Array.isArray(detectedNames)) {
        detectedNames = [cleanedText];
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini output:", textOutput);
      return NextResponse.json(
        { error: "Gemini returned invalid format", rawOutput: textOutput },
        { status: 500 },
      );
    }
    console.log("Detected Names:", detectedNames);
    return NextResponse.json(detectedNames, { status: 200 });
  } catch (error) {
    console.error("Error in detect-food:", error);
    // Determine if it's a payload-too-large issue implicitly via internal errors
    const isPayloadLarge = error.message && error.message.includes("size");
    return NextResponse.json(
      {
        error: isPayloadLarge
          ? "Image file is too large."
          : "Internal Server Error",
      },
      { status: isPayloadLarge ? 413 : 500 },
    );
  }
}
