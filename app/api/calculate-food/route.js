import mongoose from "mongoose";
import { NextResponse } from "next/server";
import FoodItem from "@/models/FoodItem";

async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Connected to MongoDB in calculate-food");
    } catch (error) {
      console.error("Error connecting to MongoDB:", error.message);
    }
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { foodName, quantity } = body;

    if (!foodName) {
      return NextResponse.json(
        { error: "Food name is required" },
        { status: 400 },
      );
    }

    const foodData = await FoodItem.findOne({
      name: { $regex: new RegExp(foodName, "i") },
    });

    if (!foodData) {
      // AI FALLBACK: If not in DB, roughly estimate with Gemini
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        try {
          const aiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `Give a rough nutritional estimate for 100g/100ml or 1 standard piece of "${foodName}". Return ONLY a pure JSON object (no markdown) with these exact number fields: {"kcal": number, "protein": number, "carbs": number, "fats": number, "fiber_g": number, "water_L": number, "sodium_mg": number, "potassium_mg": number, "magnesium_mg": number, "iron_mg": number, "calcium_mg": number, "vitamin_D_mcg": number, "vitamin_B12_mcg": number, "omega_3_mg": number, "antioxidant_VitE_mg": number, "baseAmount": number, "unitType": "g" | "ml" | "piece"}.`,
                      },
                    ],
                  },
                ],
              }),
            },
          );

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const textOutput =
              aiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textOutput) {
              const cleanedText = textOutput
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();
              const estimated = JSON.parse(cleanedText);

              const newFoodItem = new FoodItem({
                name: foodName.toLowerCase(),
                baseAmount: estimated.baseAmount || 100,
                unitType: estimated.unitType || "g",
                kcal: estimated.kcal || 0,
                protein: estimated.protein || 0,
                carbs: estimated.carbs || 0,
                fats: estimated.fats || 0,
                fiber_g: estimated.fiber_g || 0,
                water_L: estimated.water_L || 0,
                sodium_mg: estimated.sodium_mg || 0,
                potassium_mg: estimated.potassium_mg || 0,
                magnesium_mg: estimated.magnesium_mg || 0,
                iron_mg: estimated.iron_mg || 0,
                calcium_mg: estimated.calcium_mg || 0,
                vitamin_D_mcg: estimated.vitamin_D_mcg || 0,
                vitamin_B12_mcg: estimated.vitamin_B12_mcg || 0,
                omega_3_mg: estimated.omega_3_mg || 0,
                antioxidant_VitE_mg: estimated.antioxidant_VitE_mg || 0,
              });

              try {
                await newFoodItem.save();
                console.log(`Saved new food item to DB: ${foodName}`);
              } catch (saveError) {
                console.error("Error saving food item to DB:", saveError);
              }

              return NextResponse.json(
                {
                  id: newFoodItem._id ? newFoodItem._id.toString() : Math.random().toString(),
                  name: foodName,
                  baseUnitLabel: `${estimated.baseAmount || 100}${estimated.unitType || "g"} (AI Est.)`,
                  baseAmount: estimated.baseAmount || 100,
                  unitType: estimated.unitType || "g",
                  kcal: estimated.kcal || 0,
                  protein: estimated.protein || 0,
                  carbs: estimated.carbs || 0,
                  fat: estimated.fats || 0,
                  fiber_g: estimated.fiber_g || 0,
                  water_L: estimated.water_L || 0,
                  sodium_mg: estimated.sodium_mg || 0,
                  potassium_mg: estimated.potassium_mg || 0,
                  magnesium_mg: estimated.magnesium_mg || 0,
                  iron_mg: estimated.iron_mg || 0,
                  calcium_mg: estimated.calcium_mg || 0,
                  vitamin_D_mcg: estimated.vitamin_D_mcg || 0,
                  vitamin_B12_mcg: estimated.vitamin_B12_mcg || 0,
                  omega_3_mg: estimated.omega_3_mg || 0,
                  antioxidant_VitE_mg: estimated.antioxidant_VitE_mg || 0,
                  userInput: estimated.baseAmount || 100,
                  isAIEstimate: true,
                },
                { status: 200 },
              );
            }
          }
        } catch (e) {
          console.error("Gemini fallback failed", e);
        }
      }

      // If AI fallback also fails or isn't available
      return NextResponse.json(
        { error: `Not found: ${foodName}` },
        { status: 404 },
      );
    }

    const item = {
      id: Math.random().toString(),
      name: foodData.name
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      baseUnitLabel: `${foodData.baseAmount}${foodData.unitType}`,
      baseAmount: foodData.baseAmount,
      unitType: foodData.unitType,
      kcal: foodData.kcal,
      protein: foodData.protein,
      carbs: foodData.carbs,
      fat: foodData.fats,
      fiber_g: foodData.fiber_g || 0,
      water_L: foodData.water_L || 0,
      sodium_mg: foodData.sodium_mg || 0,
      potassium_mg: foodData.potassium_mg || 0,
      magnesium_mg: foodData.magnesium_mg || 0,
      iron_mg: foodData.iron_mg || 0,
      calcium_mg: foodData.calcium_mg || 0,
      vitamin_D_mcg: foodData.vitamin_D_mcg || 0,
      vitamin_B12_mcg: foodData.vitamin_B12_mcg || 0,
      omega_3_mg: foodData.omega_3_mg || 0,
      antioxidant_VitE_mg: foodData.antioxidant_VitE_mg || 0,
      userInput: quantity || foodData.baseAmount,
    };

    return NextResponse.json(item, { status: 200 });
  } catch (error) {
    console.error("Error in calculate-food:", error.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
