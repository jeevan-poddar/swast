import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

const MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];
const MAX_ATTEMPTS_PER_MODEL = 2;
const DEFAULT_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 30_000;
const MAX_FILES = 4;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const getRetryDelay = (response, attempt) => {
  const retryAfterSeconds = Number(response?.headers.get("retry-after"));

  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return Math.min(retryAfterSeconds * 1_000, MAX_RETRY_DELAY_MS);
  }

  return Math.min(
    DEFAULT_RETRY_DELAY_MS * 2 ** attempt,
    MAX_RETRY_DELAY_MS,
  );
};

const isRetryableStatus = (status) =>
  status === 408 || status === 429 || status >= 500;

async function generateFoodDetection(apiKey, payload) {
  let lastError;

  for (const model of MODELS) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_MODEL; attempt += 1) {
      let response;

      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
      } catch (error) {
        lastError = new Error(
          `Gemini API request failed for ${model}: ${error.message}`,
        );

        if (attempt < MAX_ATTEMPTS_PER_MODEL - 1) {
          await sleep(getRetryDelay(null, attempt));
          continue;
        }

        break;
      }

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        return data;
      }

      lastError = new Error(
        `Gemini API request failed for ${model}: ${
          data.error?.message || response.statusText
        }`,
      );
      lastError.status = response.status;

      if (response.status === 401 || response.status === 403 || response.status === 400) {
        throw lastError;
      }

      if (!isRetryableStatus(response.status)) {
        break;
      }

      if (attempt < MAX_ATTEMPTS_PER_MODEL - 1) {
        await sleep(getRetryDelay(response, attempt));
      }
    }

    console.warn(`Gemini model ${model} failed; trying the next model`);
  }

  throw lastError || new Error("All Gemini models are unavailable");
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("file");

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Upload at most ${MAX_FILES} images at once` }, { status: 400 });
    }

    const totalSize = files.reduce((total, file) => total + (file?.size || 0), 0);
    const hasInvalidFile = files.some(
      (file) =>
        !file ||
        typeof file.arrayBuffer !== "function" ||
        !ALLOWED_IMAGE_TYPES.has(file.type) ||
        !file.size ||
        file.size > MAX_FILE_SIZE_BYTES,
    );
    if (hasInvalidFile || totalSize > MAX_TOTAL_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Use JPEG, PNG, or WEBP images up to 10 MB each (20 MB total)." },
        { status: 413 },
      );
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
              text: 'Analyze these images and identify all visible food items, including the estimated amount visible. Return ONLY a valid JSON array of objects with this exact shape: [{"name":"Apple","quantity":150,"unit":"g"}]. Use a numeric quantity and one unit from "g", "ml", or "piece". For countable foods use "piece"; use "g" or "ml" when the amount is better estimated by weight or volume. Do NOT output any markdown blocks (e.g. ```json). Do NOT add conversational text.',
            },
            ...imageParts,
          ],
        },
      ],
    };

    const data = await generateFoodDetection(apiKey, payload);

    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textOutput) {
      return NextResponse.json(
        { error: "No valid response from Gemini" },
        { status: 500 },
      );
    }

    let detectedFoods = [];
    try {
      const cleanedText = textOutput
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      detectedFoods = JSON.parse(cleanedText);

      if (!Array.isArray(detectedFoods)) {
        throw new Error("Gemini response was not an array");
      }

      detectedFoods = detectedFoods
        .map((food) => ({
          name: String(food.name || "").trim(),
          quantity: Number(food.quantity),
          unit: String(food.unit || "").toLowerCase(),
        }))
        .filter(
          (food) =>
            food.name &&
            Number.isFinite(food.quantity) &&
            food.quantity > 0 &&
            ["g", "ml", "piece"].includes(food.unit),
        );
    } catch (parseError) {
      console.error("Failed to parse Gemini output:", textOutput);
      return NextResponse.json(
        { error: "Gemini returned invalid format", rawOutput: textOutput },
        { status: 500 },
      );
    }
    console.log("Detected Foods:", detectedFoods);
    return NextResponse.json(detectedFoods, { status: 200 });
  } catch (error) {
    console.error("Error in detect-food:", error);
    // Determine if it's a payload-too-large issue implicitly via internal errors
    const isPayloadLarge = error.message && error.message.includes("size");
    return NextResponse.json(
      {
        error: isPayloadLarge
          ? "Image file is too large."
          : error.message || "Internal Server Error",
      },
      { status: isPayloadLarge ? 413 : error.status || 500 },
    );
  }
}
