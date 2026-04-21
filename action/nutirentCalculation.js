import { calculateTDEE } from "./TDEECalculator";

// ==========================================
// MACRONUTRIENT FUNCTIONS
// ==========================================

const calculateProtein = (weight, jobType) => {
  let multiplier = 1.0; // Default Desk Life
  switch (jobType) {
    case "1":
      multiplier = 1.0;
      break;
    case "2":
      multiplier = 1.2;
      break;
    case "3":
      multiplier = 1.5;
      break;
    case "4":
      multiplier = 1.8;
      break; // Labor/Athlete
  }
  return weight * multiplier;
};

const calculateFats = (tdee) => {
  // 25% of total calories dedicated to fats (1g fat = 9 kcal)
  return (tdee * 0.25) / 9;
};

const calculateCarbs = (tdee, proteinGrams, fatGrams) => {
  // Remainder of calories go to carbs (1g carb/protein = 4 kcal)
  const proteinCalories = proteinGrams * 4;
  const fatCalories = fatGrams * 9;
  const remainingCalories = tdee - proteinCalories - fatCalories;
  return Math.max(0, remainingCalories / 4); // Prevents negative carbs in extreme deficits
};

// ==========================================
// MICRONUTRIENT & FUNCTIONAL FUNCTIONS
// ==========================================

const calculateFiber = (tdee) => {
  // 14g per 1000 kcal
  return (tdee / 1000) * 14;
};

const calculateSodium = (isIntenseDay) => {
  // Base 2300mg. Spike by 500mg for sweat loss.
  return isIntenseDay ? 2800 : 2300;
};

const calculatePotassium = () => {
  return 4700; // Standard athlete/adult target in mg
};

// Add gender as a parameter
const calculateWater = (weight, gender, isIntenseDay) => {
  // NAS Guidelines for Total Fluid (Liters)
  const baseWater = gender === "Male" ? 3.7 : 2.7;

  // Approximately 20% of water comes from food, so we adjust the drinking target
  let drinkingWaterTarget = baseWater * 0.8;

  // ACSM Guideline: Add 0.5L to 1L for intense exercise/sweating
  if (isIntenseDay) {
    drinkingWaterTarget += 1.0;
  }
  return parseFloat(drinkingWaterTarget.toFixed(1));
};

const calculateIron = (gender, jobType) => {
  // NIH Guidelines for Iron (mg)
  let baseIron = gender === "Male" ? 8 : 18;

  // Red blood cell destruction is higher in athletes/heavy labor (Foot-strike hemolysis)
  if (jobType === "3" || jobType === "4") {
    baseIron += gender === "Male" ? 4 : 6;
  }
  return baseIron;
};

const calculateMagnesium = (gender, isIntenseDay) => {
  // NIH Guidelines for Magnesium (mg)
  let baseMag = gender === "Male" ? 420 : 320;

  // Extra magnesium depleted during intense muscle contraction
  return isIntenseDay ? baseMag + 50 : baseMag;
};

const calculateCalcium = () => {
  return 1000; // Bone density baseline in mg
};

const calculateVitaminD = () => {
  return 20; // Daily value in micrograms (mcg)
};

const calculateVitaminB12 = () => {
  return 2.4; // Daily value in mcg (crucial for veg diets)
};

const calculateOmega3 = () => {
  return 500; // EPA/DHA brain health target in mg
};

const calculateAntioxidants = (isIntenseDay) => {
  // Vitamin E equivalent in mg. Spike for oxidative stress.
  return isIntenseDay ? 20 : 15;
};

// ==========================================
// MAIN EXPORT FUNCTION
// ==========================================

export const calculateNutrients = async (id) => {
  try {
    const { TDEEByDay, userData, metValueByDay } = await calculateTDEE(id);
    console.log("THE TDEE", TDEEByDay);

    const weight = userData?.weight || 70; // Fallback weight
    const jobType = userData?.jobType || "1";
    const gender = userData?.gender || "Male";

    const weeklyNutrients = {};

    // Loop through each day to calculate dynamic targets
    for (const day in TDEEByDay) {
      const dailyTDEE = TDEEByDay[day];
      let isIntenseDay = false;
      // Determine if it's an intense day based on MET value (arbitrary threshold of 6.0)

      const metValue = metValueByDay[day] || 0;
      if (metValue >= 6.0) {
        isIntenseDay = true;
      }
      console.log(
        `Day: ${day}, TDEE: ${dailyTDEE}, MET: ${metValue}, Intense: ${isIntenseDay}`,
      );

      // 1. Calculate Macronutrients
      const protein = calculateProtein(weight, jobType);
      const fats = calculateFats(dailyTDEE);
      const carbs = calculateCarbs(dailyTDEE, protein, fats);

      // 2. Build the Daily Object
      weeklyNutrients[day] = {
        calories: Math.round(dailyTDEE),
        macros: {
          protein_g: Math.round(protein),
          fats_g: Math.round(fats),
          carbs_g: Math.round(carbs),
        },
        micros: {
          fiber_g: Math.round(calculateFiber(dailyTDEE)),
          water_L: calculateWater(weight, gender, isIntenseDay), // Updated
          sodium_mg: calculateSodium(isIntenseDay),
          potassium_mg: calculatePotassium(),
          magnesium_mg: calculateMagnesium(gender, isIntenseDay), // Updated
          iron_mg: calculateIron(gender, jobType), // Updated
          calcium_mg: calculateCalcium(),
          vitamin_D_mcg: calculateVitaminD(),
          vitamin_B12_mcg: calculateVitaminB12(),
          omega_3_mg: calculateOmega3(),
          antioxidant_VitE_mg: calculateAntioxidants(isIntenseDay),
        },
      };
    }

    console.log("Calculated Weekly Nutrients:", weeklyNutrients);
    return weeklyNutrients;
  } catch (error) {
    console.error("Error calculating nutrients:", error);
  }
};
