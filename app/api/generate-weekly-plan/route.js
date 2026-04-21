import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, dailyTargets, dailyBudget } = body;

    if (!dailyTargets || !dailyBudget) {
        return NextResponse.json({ message: "dailyTargets and dailyBudget are required" }, { status: 400 });
    }

    const systemInstruction = `You are an elite sports nutritionist and an Indian grocery market expert. Generate a 7-day meal plan (Mon-Sun) with 4 meals a day. The user has a kettle only. Daily targets must strictly hit the provided macros/micros. Suggest cheap, common Indian hostel foods (e.g., Sattu, Soy Chunks, Peanuts, Masoor Dal, Eggs). You must estimate the realistic cost of each ingredient in INR (₹). CRITICAL RULE: Rice and Wheat are FREE (cost 0), but still count their macros. Daily cost MUST remain under ₹${dailyBudget}.`;

    const promptData = `
      Daily Targets:
      ${JSON.stringify(dailyTargets, null, 2)}
      
      Required Output Schema Strategy:
      {
        "weekly_plan": {
          "monday": {
            "daily_cost": Number,
            "meals": {
              "breakfast": { "meal_name": String, "components": [{ "name": String, "quantity": Number, "unit": String, "cost": Number }] },
              "lunch": { "meal_name": String, "components": [{ "name": String, "quantity": Number, "unit": String, "cost": Number }] },
              "snack": { "meal_name": String, "components": [{ "name": String, "quantity": Number, "unit": String, "cost": Number }] },
              "dinner": { "meal_name": String, "components": [{ "name": String, "quantity": Number, "unit": String, "cost": Number }] }
            }
          },
          ... // tuesday to sunday
        }
      }
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction,
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const result = await model.generateContent(promptData);
    const textResponse = result.response.text();
    const parsedPlan = JSON.parse(textResponse);

    let isMathValid = verifyPlanMath(parsedPlan, dailyBudget);
    if (!isMathValid) {
       console.warn("WARNING: Generated plan budget exceeded or component cost math is incorrect.");
    }

    return NextResponse.json(parsedPlan, { status: 200 });
  } catch (error) {
    console.error("Error generating weekly plan:", error);
    return NextResponse.json({ message: "Failed to generate weekly plan", error: error.message }, { status: 500 });
  }
}

// Rewritten math verification logic (No Database, AI-Only)
function verifyPlanMath(parsedPlan, maxDailyCost) {
    if (!parsedPlan || !parsedPlan.weekly_plan) return false;
    
    let allValid = true;

    Object.keys(parsedPlan.weekly_plan).forEach(day => {
        let calculatedDailyCost = 0;
        const dayPlan = parsedPlan.weekly_plan[day];
        
        if (dayPlan.meals) {
            Object.keys(dayPlan.meals).forEach(slot => {
                const meal = dayPlan.meals[slot];
                if (meal.components && Array.isArray(meal.components)) {
                    meal.components.forEach(comp => {
                        calculatedDailyCost += (comp.cost || 0);
                    });
                }
            });
        }
        
        calculatedDailyCost = Math.round(calculatedDailyCost * 100) / 100;
        
        // Ensure the stated daily_cost roughly matches the sum of components
        if (Math.abs(dayPlan.daily_cost - calculatedDailyCost) > 1) {
            allValid = false;
        }

        // Must not exceed maxDailyCost
        if (dayPlan.daily_cost > maxDailyCost) {
            allValid = false;
        }
    });

    return allValid;
}
