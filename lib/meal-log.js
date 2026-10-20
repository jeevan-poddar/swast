export const DEFAULT_MEALS = ["breakfast", "lunch", "dinner"];
export const DEFAULT_MEAL_SLOT = {
  status: "not_reported",
  items: [],
  total_nutrients: {},
};

export function normalizeMealSlot(slot) {
  if (!slot) return { ...DEFAULT_MEAL_SLOT, totalNutrients: {} };

  return {
    ...slot,
    totalNutrients: slot.totalNutrients ?? slot.total_nutrients ?? {},
  };
}

export function normalizeMealLog(row) {
  if (!row) return null;

  const log = {
    userId: row.user_id,
    date: row.date,
    mealsList: row.meals_list ?? DEFAULT_MEALS,
    breakfast: normalizeMealSlot(row.breakfast),
    lunch: normalizeMealSlot(row.lunch),
    dinner: normalizeMealSlot(row.dinner),
  };

  Object.assign(
    log,
    Object.fromEntries(
      Object.entries(row.extra_meals ?? {}).map(([mealType, slot]) => [
        mealType,
        normalizeMealSlot(slot),
      ]),
    ),
  );

  return log;
}
