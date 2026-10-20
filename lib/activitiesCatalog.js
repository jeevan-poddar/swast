/**
 * Comprehensive Catalog of Physical Activities with MET (Metabolic Equivalent of Task) values.
 * Standardized according to the Compendium of Physical Activities.
 */

export const ACTIVITIES_CATALOG = [
  // Gym & Strength
  {
    name: "Weight Lifting - Vigorous (Bodybuilding/Powerlifting)",
    shortName: "Weight Lifting (Vigorous / Heavy)",
    category: "Gym & Strength",
    met: 6.0,
    emoji: "🏋️",
    intensity: "Vigorous",
  },
  {
    name: "Weight Lifting - Light or moderate effort (General)",
    shortName: "Weight Lifting (Moderate / General)",
    category: "Gym & Strength",
    met: 3.5,
    emoji: "🏋️",
    intensity: "Moderate",
  },
  {
    name: "Calisthenics - Vigorous Vigorous (Jumping jacks, burpees, heavy effort)",
    shortName: "Calisthenics / Burpees (Vigorous)",
    category: "Gym & Strength",
    met: 8.0,
    emoji: "💪",
    intensity: "High",
  },
  {
    name: "Calisthenics - Moderate (Pushups, situps, lunges)",
    shortName: "Calisthenics / Bodyweight (Moderate)",
    category: "Gym & Strength",
    met: 3.8,
    emoji: "💪",
    intensity: "Moderate",
  },
  {
    name: "Circuit Training - General (Minimal rest between sets)",
    shortName: "Circuit Training",
    category: "Gym & Strength",
    met: 8.0,
    emoji: "⚡",
    intensity: "High",
  },
  {
    name: "HIIT Workout",
    shortName: "HIIT Workout",
    category: "Gym & Strength",
    met: 8.0,
    emoji: "🔥",
    intensity: "High",
  },
  {
    name: "Crossfit / Functional Training",
    shortName: "Crossfit / Functional Fitness",
    category: "Gym & Strength",
    met: 8.5,
    emoji: "🔥",
    intensity: "High",
  },
  {
    name: "Yoga",
    shortName: "Yoga (Hatha / Mobility)",
    category: "Mind & Body",
    met: 2.5,
    emoji: "🧘",
    intensity: "Light",
  },
  {
    name: "Pilates",
    shortName: "Pilates (Mat / Core)",
    category: "Mind & Body",
    met: 3.0,
    emoji: "🧘",
    intensity: "Moderate",
  },

  // Running & Walking
  {
    name: "Running - Vigorous (10.0 mph)",
    shortName: "Running - Sprint / Fast (10 mph)",
    category: "Running & Walking",
    met: 16.0,
    emoji: "🏃",
    intensity: "Extreme",
  },
  {
    name: "Running - Moderate (6.0 mph)",
    shortName: "Running (6.0 mph / 10 km/h)",
    category: "Running & Walking",
    met: 10.0,
    emoji: "🏃",
    intensity: "High",
  },
  {
    name: "Jogging",
    shortName: "Jogging (Steady pace)",
    category: "Running & Walking",
    met: 7.0,
    emoji: "🏃",
    intensity: "Moderate",
  },
  {
    name: "Walking - Brisk (4.0 mph)",
    shortName: "Brisk Walking (4.0 mph / 6.4 km/h)",
    category: "Running & Walking",
    met: 5.0,
    emoji: "🚶",
    intensity: "Moderate",
  },
  {
    name: "Walking - Moderate (3.0 mph)",
    shortName: "Walking (3.0 mph / 4.8 km/h)",
    category: "Running & Walking",
    met: 3.5,
    emoji: "🚶",
    intensity: "Light",
  },
  {
    name: "Walking - Strolling (Very slow, < 2.0 mph)",
    shortName: "Casual Stroll (< 2.0 mph)",
    category: "Running & Walking",
    met: 2.0,
    emoji: "🚶",
    intensity: "Light",
  },
  {
    name: "Hiking - Vigorous (Steep terrain)",
    shortName: "Mountain Hiking (Steep terrain)",
    category: "Outdoor",
    met: 9.0,
    emoji: "🥾",
    intensity: "High",
  },
  {
    name: "Hiking - Moderate (Uneven terrain)",
    shortName: "Trail Hiking (Moderate)",
    category: "Outdoor",
    met: 6.0,
    emoji: "🥾",
    intensity: "Moderate",
  },
  {
    name: "Treadmill - Incline Walking",
    shortName: "Treadmill Incline Walking",
    category: "Running & Walking",
    met: 6.0,
    emoji: "🏃",
    intensity: "Moderate",
  },

  // Cycling
  {
    name: "Cycling - Racing (> 16 mph)",
    shortName: "Road Cycling (> 16 mph)",
    category: "Cycling",
    met: 16.0,
    emoji: "🚴",
    intensity: "Extreme",
  },
  {
    name: "Cycling - Vigorous (14-15.9 mph)",
    shortName: "Cycling - Fast (14-16 mph)",
    category: "Cycling",
    met: 10.0,
    emoji: "🚴",
    intensity: "High",
  },
  {
    name: "Cycling - Moderate (12-13.9 mph)",
    shortName: "Cycling - Moderate (12-14 mph)",
    category: "Cycling",
    met: 8.0,
    emoji: "🚴",
    intensity: "Moderate",
  },
  {
    name: "Cycling - Leisure (Light effort, < 10 mph)",
    shortName: "Cycling - Leisure (< 10 mph)",
    category: "Cycling",
    met: 4.0,
    emoji: "🚴",
    intensity: "Light",
  },
  {
    name: "Spinning / Stationary Bike",
    shortName: "Stationary Bike / Spin Class",
    category: "Cycling",
    met: 7.0,
    emoji: "🚴",
    intensity: "Moderate",
  },

  // Swimming
  {
    name: "Swimming - Vigorous (Butterfly, fast freestyle)",
    shortName: "Swimming (Vigorous / Fast)",
    category: "Swimming",
    met: 11.0,
    emoji: "🏊",
    intensity: "High",
  },
  {
    name: "Swimming - Moderate (Freestyle, breaststroke)",
    shortName: "Swimming (Moderate Laps)",
    category: "Swimming",
    met: 8.0,
    emoji: "🏊",
    intensity: "Moderate",
  },
  {
    name: "Swimming - Leisure (Light effort)",
    shortName: "Swimming (Casual / Leisure)",
    category: "Swimming",
    met: 4.0,
    emoji: "🏊",
    intensity: "Light",
  },

  // Sports & Combat
  {
    name: "Badminton - Competitive (Match play)",
    shortName: "Badminton (Competitive Match)",
    category: "Sports",
    met: 7.0,
    emoji: "🏸",
    intensity: "High",
  },
  {
    name: "Badminton - Recreational (Playing for fun)",
    shortName: "Badminton (Casual Play)",
    category: "Sports",
    met: 4.5,
    emoji: "🏸",
    intensity: "Moderate",
  },
  {
    name: "Basketball - Game play (Vigorous)",
    shortName: "Basketball (Full Game)",
    category: "Sports",
    met: 8.0,
    emoji: "🏀",
    intensity: "High",
  },
  {
    name: "Basketball - Shooting Basket (Casual)",
    shortName: "Basketball (Shooting Around)",
    category: "Sports",
    met: 4.5,
    emoji: "🏀",
    intensity: "Moderate",
  },
  {
    name: "Football (Soccer) - Competitive (Match play)",
    shortName: "Football / Soccer (Match)",
    category: "Sports",
    met: 7.0,
    emoji: "⚽",
    intensity: "High",
  },
  {
    name: "Football (Soccer) - Recreational (Playing for fun)",
    shortName: "Football / Soccer (Casual)",
    category: "Sports",
    met: 5.0,
    emoji: "⚽",
    intensity: "Moderate",
  },
  {
    name: "Cricket - Competitive (Match play)",
    shortName: "Cricket (Match Play)",
    category: "Sports",
    met: 6.0,
    emoji: "🏏",
    intensity: "Moderate",
  },
  {
    name: "Cricket - Recreational (Playing for fun)",
    shortName: "Cricket (Casual / Nets)",
    category: "Sports",
    met: 4.0,
    emoji: "🏏",
    intensity: "Moderate",
  },
  {
    name: "Tennis - Competitive (Match play)",
    shortName: "Tennis (Competitive Match)",
    category: "Sports",
    met: 7.3,
    emoji: "🎾",
    intensity: "High",
  },
  {
    name: "Tennis - Recreational (Playing for fun)",
    shortName: "Tennis (Rally / Practice)",
    category: "Sports",
    met: 5.0,
    emoji: "🎾",
    intensity: "Moderate",
  },
  {
    name: "Table Tennis - Competitive (Match play)",
    shortName: "Table Tennis (Competitive)",
    category: "Sports",
    met: 6.0,
    emoji: "🏓",
    intensity: "Moderate",
  },
  {
    name: "Table Tennis - Recreational (Playing for fun)",
    shortName: "Table Tennis (Ping Pong)",
    category: "Sports",
    met: 4.0,
    emoji: "🏓",
    intensity: "Light",
  },
  {
    name: "Volleyball - Competitive (Match play)",
    shortName: "Volleyball (Match Play)",
    category: "Sports",
    met: 6.0,
    emoji: "🏐",
    intensity: "Moderate",
  },
  {
    name: "Volleyball - Recreational (Playing for fun)",
    shortName: "Beach Volleyball / Fun",
    category: "Sports",
    met: 3.0,
    emoji: "🏐",
    intensity: "Light",
  },
  {
    name: "Boxing - Sparring (Vigorous effort)",
    shortName: "Boxing (Sparring / Bag)",
    category: "Combat",
    met: 8.0,
    emoji: "🥊",
    intensity: "High",
  },
  {
    name: "Boxing - Shadow Boxing (Light effort)",
    shortName: "Boxing (Shadow Boxing)",
    category: "Combat",
    met: 3.8,
    emoji: "🥊",
    intensity: "Moderate",
  },
  {
    name: "Martial Arts - General (Karate, Taekwondo, Judo)",
    shortName: "Martial Arts / MMA / Judo",
    category: "Combat",
    met: 10.0,
    emoji: "🥋",
    intensity: "High",
  },

  // Household & Lifestyle
  {
    name: "Cleaning - Vigorous (Scrubbing, heavy cleaning)",
    shortName: "Deep Cleaning / Scrubbing",
    category: "Household",
    met: 6.0,
    emoji: "🧹",
    intensity: "Moderate",
  },
  {
    name: "Cleaning - Moderate (Vacuuming, mopping)",
    shortName: "Vacuuming / Mopping",
    category: "Household",
    met: 4.0,
    emoji: "🧹",
    intensity: "Light",
  },
  {
    name: "Cleaning - Light (Dusting, washing dishes)",
    shortName: "Dusting / Dishwashing",
    category: "Household",
    met: 2.5,
    emoji: "🧽",
    intensity: "Light",
  },
  {
    name: "Gardening - Vigorous (Digging, heavy labor)",
    shortName: "Gardening (Digging / Shoveling)",
    category: "Household",
    met: 7.0,
    emoji: "🌱",
    intensity: "High",
  },
  {
    name: "Gardening - Moderate (Weeding, raking)",
    shortName: "Gardening (Weeding / Raking)",
    category: "Household",
    met: 5.0,
    emoji: "🌱",
    intensity: "Moderate",
  },
  {
    name: "Cooking - Vigorous (Chopping, stirring, heavy effort)",
    shortName: "Active Cooking / Kitchen Prep",
    category: "Household",
    met: 4.0,
    emoji: "🍳",
    intensity: "Moderate",
  },
  {
    name: "Cooking - General (Standing, light activity)",
    shortName: "Cooking / Light Standing",
    category: "Household",
    met: 2.0,
    emoji: "🍳",
    intensity: "Light",
  },
];

/**
 * Smart MET lookup with fallback matching.
 * Matches exact names, lowercase names, and keywords.
 */
export function getMETForActivity(name) {
  if (!name) return 4.0; // sensible baseline
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  // 1. Direct exact or lowercase match
  const exact = ACTIVITIES_CATALOG.find(
    (a) => a.name.toLowerCase() === lower || a.shortName?.toLowerCase() === lower
  );
  if (exact) return exact.met;

  // 2. Keyword matching
  if (lower.includes("sprint") || lower.includes("racing")) return 16.0;
  if (lower.includes("run") || lower.includes("treadmill")) return 10.0;
  if (lower.includes("swim")) return 8.0;
  if (lower.includes("hiit") || lower.includes("crossfit") || lower.includes("circuit")) return 8.0;
  if (lower.includes("cycle") || lower.includes("biking") || lower.includes("cycling")) return 8.0;
  if (lower.includes("box") || lower.includes("martial") || lower.includes("karate")) return 8.0;
  if (lower.includes("jog")) return 7.0;
  if (lower.includes("football") || lower.includes("soccer") || lower.includes("badminton") || lower.includes("tennis")) return 6.5;
  if (lower.includes("weight") || lower.includes("gym") || lower.includes("lift") || lower.includes("strength") || lower.includes("dumbbell")) return 6.0;
  if (lower.includes("hike") || lower.includes("hiking")) return 6.0;
  if (lower.includes("basketball") || lower.includes("cricket") || lower.includes("volleyball")) return 5.5;
  if (lower.includes("walk")) return 4.5;
  if (lower.includes("calisthenic") || lower.includes("bodyweight") || lower.includes("pushup")) return 5.0;
  if (lower.includes("clean") || lower.includes("garden")) return 4.0;
  if (lower.includes("yoga") || lower.includes("pilates") || lower.includes("stretch")) return 3.0;
  if (lower.includes("cook")) return 2.5;

  return 5.0; // General default workout MET
}
