import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const getRetryDelay = (response, attempt) => {
  const retryAfterSeconds = Number(response?.headers.get("retry-after"));

  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return Math.min(retryAfterSeconds * 1_000, MAX_RETRY_DELAY_MS);
  }

  return Math.min(DEFAULT_RETRY_DELAY_MS * 2 ** attempt, MAX_RETRY_DELAY_MS);
};

const isRetryableStatus = (status) =>
  status === 408 || status === 429 || status >= 500;

const normalizeUnit = (unit) => {
  const normalized = String(unit || "")
    .trim()
    .toLowerCase();
  const aliases = {
    gram: "g",
    grams: "g",
    kilogram: "g",
    kilograms: "g",
    milliliter: "ml",
    milliliters: "ml",
    litre: "ml",
    liter: "ml",
    liters: "ml",
    piece: "piece",
    pieces: "piece",
  };

  return aliases[normalized] || normalized;
};

const NUTRIENT_FIELDS = [
  "kcal",
  "protein",
  "carbs",
  "fats",
  "fiber_g",
  "water_L",
  "sodium_mg",
  "potassium_mg",
  "magnesium_mg",
  "iron_mg",
  "calcium_mg",
  "vitamin_D_mcg",
  "vitamin_B12_mcg",
  "omega_3_mg",
  "antioxidant_VitE_mg",
];

function isValidEstimate(estimate) {
  return (
    estimate &&
    Number.isFinite(Number(estimate.baseAmount)) &&
    Number(estimate.baseAmount) > 0 &&
    Number(estimate.baseAmount) <= 100_000 &&
    ["g", "ml", "piece"].includes(estimate.unitType) &&
    NUTRIENT_FIELDS.every((field) => {
      const value = Number(estimate[field]);
      return Number.isFinite(value) && value >= 0 && value <= 1_000_000;
    })
  );
}

async function generateFoodEstimate(apiKey, payload) {
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

      if (
        response.status === 401 ||
        response.status === 403 ||
        response.status === 400
      ) {
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

    const body = await req.json();
    const { foodName, quantity, unit } = body;
    const normalizedFoodName = String(foodName || "")
      .trim()
      .toLowerCase();
    const requestedQuantity = Number(quantity);
    const requestedUnit = normalizeUnit(unit);

    if (!normalizedFoodName || normalizedFoodName.length > 120) {
      return NextResponse.json(
        { error: "Food name is required" },
        { status: 400 },
      );
    }

    if (unit && !["g", "ml", "piece"].includes(requestedUnit)) {
      return NextResponse.json(
        { error: "Unsupported serving unit" },
        { status: 400 },
      );
    }
    if (
      quantity !== undefined &&
      (!Number.isFinite(requestedQuantity) ||
        requestedQuantity <= 0 ||
        requestedQuantity > 100_000)
    ) {
      return NextResponse.json(
        { error: "Invalid serving quantity" },
        { status: 400 },
      );
    }

    // Use only an exact canonical match; partial matching can return unrelated food.
    const { data: foodData, error } = await supabaseAdmin
      .from("food_items")
      .select("*")
      .eq("name", normalizedFoodName)
      .maybeSingle();

    if (error) {
      console.error("[calculate-food] Supabase error:", error.message);
      throw error;
    }

    const hasRequestedServing =
      Number.isFinite(requestedQuantity) &&
      requestedQuantity > 0 &&
      requestedUnit;
    const usesRequestedServing =
      hasRequestedServing && requestedUnit === foodData?.unit_type;

    if (foodData && (!hasRequestedServing || usesRequestedServing)) {
      const item = {
        id: foodData.id,
        name: foodData.name
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        baseUnitLabel: `${foodData.base_amount}${foodData.unit_type}`,
        baseAmount: foodData.base_amount,
        unitType: foodData.unit_type,
        kcal: foodData.kcal,
        protein: foodData.protein,
        carbs: foodData.carbs,
        fat: foodData.fats,
        fiber_g: foodData.fiber ?? 0,
        water_L: foodData.water ?? 0,
        sodium_mg: foodData.sodium ?? 0,
        potassium_mg: foodData.potassium ?? 0,
        magnesium_mg: foodData.magnesium ?? 0,
        iron_mg: foodData.iron ?? 0,
        calcium_mg: foodData.calcium ?? 0,
        vitamin_D_mcg: foodData.vit_d ?? 0,
        vitamin_B12_mcg: foodData.vit_b12 ?? 0,
        omega_3_mg: foodData.omega3 ?? 0,
        antioxidant_VitE_mg: foodData.vit_e ?? 0,
        userInput: usesRequestedServing
          ? requestedQuantity
          : foodData.base_amount,
        inputUnit: usesRequestedServing ? requestedUnit : foodData.unit_type,
      };
      return NextResponse.json(item, { status: 200 });
    }

    // ── AI Fallback ────────────────────────────────────────────────────────────
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const payload = {
          contents: [
            {
              parts: [
                {
                  text: `Give a realistic, rough nutritional estimate for the food: "${foodName}".

Quantity instructions:
- If requestedQuantity is a finite positive number and requestedUnit is one of "g", "ml", or "piece", estimate nutrition for exactly that quantity and return that quantity as baseAmount with the same unitType.
- Otherwise, estimate for 100 g for solid foods, 100 ml for liquids, or 1 standard piece when the food is normally counted by piece.
- All nutrient values MUST represent the entire specified baseAmount, not values per 100 g unless baseAmount is 100 g.
- For pieces, assume a reasonable standard edible portion and account for its weight in the estimate.

Return ONLY a valid JSON object, without Markdown, explanations, comments, or additional keys:

{
  "kcal": number,
  "protein": number,
  "carbs": number,
  "fats": number,
  "fiber_g": number,
  "water_L": number,
  "sodium_mg": number,
  "potassium_mg": number,
  "magnesium_mg": number,
  "iron_mg": number,
  "calcium_mg": number,
  "vitamin_D_mcg": number,
  "vitamin_B12_mcg": number,
  "omega_3_mg": number,
  "antioxidant_VitE_mg": number,
  "baseAmount": number,
  "unitType": "g" | "ml" | "piece"
}

Nutrition rules:
1. Estimate nutrition for the food in its specified preparation state. Distinguish raw, cooked, boiled, fried, and packaged foods where relevant.
2. For homemade or mixed dishes, use a typical recipe for the stated cuisine. Account for realistic amounts of oil, dairy, flour, and other ingredients.
3. Ensure calories are reasonably consistent with macronutrients. As a basic check, use approximately 4 kcal/g for protein, 4 kcal/g for carbohydrates, and 9 kcal/g for fat. Allow for fiber, rounding, and food-specific energy factors.
4. Estimate water_L as the approximate liters of water contained in the entire specified serving. For example, 150 g of cooked rice should contain roughly 0.09–0.11 liters of water, depending on preparation.
5. All mineral values must be in milligrams (mg), vitamin D and B12 in micrograms (mcg), vitamin E in milligrams (mg), and omega-3 in milligrams (mg).
6. Never invent precision. Return reasonable rounded estimates.
7. Use 0 only when the nutrient is genuinely absent or negligible. If a value cannot be reliably estimated, do not silently present a fabricated value as certain; use the closest reasonable estimate based on typical food composition.
8. If the food name is ambiguous or misspelled, interpret it only when the intended food is reasonably clear. Otherwise, estimate for the closest likely interpretation without claiming certainty.
9. Return numeric JSON values, not strings containing numbers.
10. Do not include prices, database IDs, timestamps, or additional fields.`,
                },
              ],
            },
          ],
          generationConfig: { responseMimeType: "application/json" },
        };
        const data = await generateFoodEstimate(apiKey, payload);
        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (textOutput) {
          const cleaned = textOutput
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
          const estimated = JSON.parse(cleaned);
          if (!isValidEstimate(estimated)) {
            return NextResponse.json(
              { error: "Food estimate contained invalid nutrient values" },
              { status: 502 },
            );
          }

          // Persist to food_items for future lookups
          const newItem = {
            name: normalizedFoodName,
            base_amount: estimated.baseAmount || 100,
            unit_type: estimated.unitType || "g",
            kcal: estimated.kcal || 0,
            protein: estimated.protein || 0,
            carbs: estimated.carbs || 0,
            fats: estimated.fats || 0,
            fiber: estimated.fiber_g || 0,
            water: estimated.water_L || 0,
            sodium: estimated.sodium_mg || 0,
            potassium: estimated.potassium_mg || 0,
            magnesium: estimated.magnesium_mg || 0,
            iron: estimated.iron_mg || 0,
            calcium: estimated.calcium_mg || 0,
            vit_d: estimated.vitamin_D_mcg || 0,
            vit_b12: estimated.vitamin_B12_mcg || 0,
            omega3: estimated.omega_3_mg || 0,
            vit_e: estimated.antioxidant_VitE_mg || 0,
          };

          // Upsert so repeated AI lookups don't fail on duplicate name
          let inserted;
          if (!foodData) {
            const { data, error: upsertError } = await supabaseAdmin
              .from("food_items")
              .upsert(newItem, { onConflict: "name" })
              .select("id")
              .single();
            inserted = data;

            if (upsertError) {
              console.error(
                "[calculate-food] Failed to cache AI estimate:",
                upsertError.message,
              );
            }
          }

          return NextResponse.json(
            {
              id: inserted?.id ?? crypto.randomUUID(),
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
              inputUnit: estimated.unitType || "g",
              isAIEstimate: true,
            },
            { status: 200 },
          );
        }
      } catch (e) {
        console.error("[calculate-food] Gemini fallback failed:", e);
      }
    }

    return NextResponse.json(
      { error: `Not found: ${foodName}` },
      { status: 404 },
    );
  } catch (error) {
    console.error("[calculate-food] Error:", error.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
