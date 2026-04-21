import { calculateActivityCalories } from "./activityCaloriesCalculator";
import calculateAge from "./ageCalculator";

const BMR = (weight, height, age, gender) => {
  if (gender === "Male") {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};
const BMRJobTypeCalc = (bmr, jobType) => {
  switch (jobType) {
    case "1":
      return bmr * 1.2;
    case "2":
      return bmr * 1.375;
    case "3":
      return bmr * 1.55;
    case "4":
      return bmr * 1.725;
    default:
      return bmr; // No activity level provided, return BMR as is
  }
};
const caloriesDueToGoal = (goal, wieght, days) => {
  switch (goal) {
    case "Lose Weight":
      return (-7700 * wieght) / days; // Negative because we want to create a calorie deficit
    case "Gain Weight":
      return (7700 * wieght) / days; // Positive because we want to create a calorie surplus
    default:
      return 0; // No specific goal, no additional calories needed
  }
};

export const calculateTDEE = async (id) => {
  try {
    const res = await fetch("/api/profileFetch");
    const data = await res.json();

    // BMR calculation
    const bmr = BMR(
      data?.profile?.weight,
      data?.profile?.height,
      calculateAge(data?.profile?.dob),
      data?.profile?.gender,
    );

    // Calculate BMR with Job type
    const BMRJobType = BMRJobTypeCalc(bmr, data?.profile?.jobType);

    // Calculate calories needed for goal
    const caloriesForGoal = caloriesDueToGoal(
      data?.profile?.goal,
      data?.profile?.howMuchWeight,
      data?.profile?.inHowManyDays, // Assuming a 30-day period for weight change
    );

    // Calculate extra calories burned by activities for each day of the week
    const extraCaloriesByDay = await calculateActivityCalories(
      id,
      data?.profile?.weight,
    );

    const TDEEByDay = {};
    console.log("Extra calories by day from activities:", extraCaloriesByDay);
    for (const day in extraCaloriesByDay) {
      TDEEByDay[day] =
        (BMRJobType + caloriesForGoal + extraCaloriesByDay[day].calories) * 1.1; // 1.1 is due to the thermic effect of food (TEF), which accounts for the calories burned during digestion and absorption of food. It is generally estimated to be around 10% of total calorie intake, hence the multiplication by 1.1.
    }
    console.log("Total calories needed by day:", TDEEByDay);
    const dataToReturn = {
      TDEEByDay,
      userData: {
        weight: data?.profile?.weight,
        jobType: data?.profile?.jobType,
        gender: data?.profile?.gender,
      },
      metValueByDay: {
        Monday: extraCaloriesByDay.Monday.metValue,
        Tuesday: extraCaloriesByDay.Tuesday.metValue,
        Wednesday: extraCaloriesByDay.Wednesday.metValue,
        Thursday: extraCaloriesByDay.Thursday.metValue,
        Friday: extraCaloriesByDay.Friday.metValue,
        Saturday: extraCaloriesByDay.Saturday.metValue,
        Sunday: extraCaloriesByDay.Sunday.metValue,
      },
    };
    return dataToReturn;
  } catch (e) {
    console.log("The error in TDEE calculation:", e);
  }
};








// i have calulated a calories by day now i need to cal culate 13 nutrients