const METValues = {
  // 1. Gym & Conditioning
  "Weight Lifting - Light or moderate effort (General)": 3.5,
  "Weight Lifting - Vigorous (Bodybuilding/Powerlifting)": 6.0,
  "Calisthenics - Moderate (Pushups, situps, lunges)": 3.8,
  "Calisthenics - Vigorous Vigorous (Jumping jacks, burpees, heavy effort)": 8.0,
  "Circuit Training - General (Minimal rest between sets)": 8.0,
  Yoga: 2.5,
  Pilates: 3.0,

  //   2. Common Sports
  "Badminton - Recreational (Playing for fun)": 4.5,
  "Badminton - Competitive (Match play)": 7.0,
  "Basketball - Shooting Basket (Casual)": 4.5,
  "Basketball - Game play (Vigorous)": 8.0,
  "Table Tennis - Recreational (Playing for fun)": 4.0,
  "Table Tennis - Competitive (Match play)": 6.0,
  "Tennis - Recreational (Playing for fun)": 5.0,
  "Tennis - Competitive (Match play)": 7.3,
  "Volleyball - Recreational (Playing for fun)": 3.0,
  "Volleyball - Competitive (Match play)": 6.0,
  "Boxing - Shadow Boxing (Light effort)": 3.8,
  "Boxing - Sparring (Vigorous effort)": 8.0,
  "Martial Arts - General (Karate, Taekwondo, Judo)": 10.0,
  "Cricket - Recreational (Playing for fun)": 4.0,
  "Cricket - Competitive (Match play)": 6.0,
  "Football (Soccer) - Recreational (Playing for fun)": 5.0,
  "Football (Soccer) - Competitive (Match play)": 7.0,

  //   3. Outdoor Activities
  "Walking - Strolling (Very slow, < 2.0 mph)": 2.0,
  "Walking - Moderate (3.0 mph)": 3.5,
  "Walking - Brisk (4.0 mph)": 5.0,
  Jogging: 7.0,
  "Running - Moderate (6.0 mph)": 10.0,
  "Running - Vigorous (10.0 mph)": 16.0,
  "Cycling - Leisure (Light effort, < 10 mph)": 4.0,
  "Cycling - Moderate (12-13.9 mph)": 8.0,
  "Cycling - Vigorous (14-15.9 mph)": 10.0,
  "Cycling - Racing (> 16 mph)": 16.0,
  "Hiking - Moderate (Uneven terrain)": 6.0,
  "Hiking - Vigorous (Steep terrain)": 9.0,
  "Swimming - Leisure (Light effort)": 4.0,
  "Swimming - Moderate (Freestyle, breaststroke)": 8.0,
  "Swimming - Vigorous (Butterfly, fast freestyle)": 11.0,

  //   4. Household Activities
  "Cleaning - Light (Dusting, washing dishes)": 2.5,
  "Cleaning - Moderate (Vacuuming, mopping)": 4.0,
  "Cleaning - Vigorous (Scrubbing, heavy cleaning)": 6.0,
  "Gardening - Light (Watering, planting)": 3.0,
  "Gardening - Moderate (Weeding, raking)": 5.0,
  "Gardening - Vigorous (Digging, heavy labor)": 7.0,
  "Cooking - General (Standing, light activity)": 2.0,
  "Cooking - Vigorous (Chopping, stirring, heavy effort)": 4.0,
};

function getCaloriesByDay(activityList, targetDay) {
  let totalCalories = 0;
  let metValueOfDay = 0;
  activityList.forEach((activity) => {
    if (activity.days.includes(targetDay)) {
      totalCalories += activity.caloriesBurned;
    
    }
    if (activity.days.includes(targetDay) && activity.metValue > metValueOfDay) {
      metValueOfDay = activity.metValue;
    }
  });
  return { calories: totalCalories, metValue: metValueOfDay };
}
export const calculateActivityCalories = async (id, weight) => {
  const activity = await fetch("/api/activityFetch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: id }),
  });
  const data = await activity.json();
  const activityData = data?.activities || [];
  const caloriesBurned = activityData.map((activity) => {
    const metValue = METValues[activity.activityName] || 1; // Default to 1 if activity type is not found
    const calories = (metValue * activity.duration * weight) / 60; // Calories burned formula
    return {
      id: activity._id,
      caloriesBurned: calories,
      days: activity.days,
      metValue: metValue,
    };
  });
  const caloriesOnMonday = getCaloriesByDay(caloriesBurned, "Monday");
  const caloriesOnTuesday = getCaloriesByDay(caloriesBurned, "Tuesday");
  const caloriesOnWednesday = getCaloriesByDay(caloriesBurned, "Wednesday");
  const caloriesOnThursday = getCaloriesByDay(caloriesBurned, "Thursday");
  const caloriesOnFriday = getCaloriesByDay(caloriesBurned, "Friday");
  const caloriesOnSaturday = getCaloriesByDay(caloriesBurned, "Saturday");
  const caloriesOnSunday = getCaloriesByDay(caloriesBurned, "Sunday");

  return {
    Monday: caloriesOnMonday,
    Tuesday: caloriesOnTuesday,
    Wednesday: caloriesOnWednesday,
    Thursday: caloriesOnThursday,
    Friday: caloriesOnFriday,
    Saturday: caloriesOnSaturday,
    Sunday: caloriesOnSunday,
  };
};
