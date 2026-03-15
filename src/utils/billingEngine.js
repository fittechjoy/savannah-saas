export function getLastDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function getFirstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getDurationMonths(duration) {
  switch (duration) {
    case "monthly":
      return 1;
    case "quarterly":
      return 3;
    case "semi_annual":
      return 6;
    case "annual":
      return 12;
    default:
      return 1;
  }
}

export function calculateDailyRate(planPrice, durationMonths, startDate) {
  const daysInCycle =
    new Date(startDate.getFullYear(), startDate.getMonth() + durationMonths, 0).getDate();

  return planPrice / daysInCycle;
}

export function calculateMonthlyProrate(planPrice, today) {
  const day = today.getDate();
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();

  const dailyRate = planPrice / daysInMonth;

  if (day <= 5) {
    return {
      baseAmount: planPrice,
      expiryDate: getLastDayOfMonth(today),
    };
  }

  const remainingDays = daysInMonth - day + 1;

  const remainingAmount = remainingDays * dailyRate;

  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return {
    baseAmount: remainingAmount + planPrice,
    expiryDate: getLastDayOfMonth(nextMonth),
  };
}

export function calculateFreezeDiscount({
  freezeDays,
  planPrice,
  duration,
  referenceDate,
}) {
  if (!freezeDays || freezeDays === 0) return 0;

  const durationMonths = getDurationMonths(duration);

  const dailyRate = calculateDailyRate(
    planPrice,
    durationMonths,
    referenceDate
  );

  return freezeDays * dailyRate;
}

export function calculateRenewal({ membership, plan, today, freezeDays }) {

  let baseDate = new Date(membership.expiry_date);

  // If membership already expired
  if (today > baseDate) {
    baseDate = today;
  }

  let newExpiry = new Date(baseDate);

  if (plan.duration === "monthly") {

    const day = today.getDate();

    if (day <= 5) {
      newExpiry = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else {
      newExpiry = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    }

  }

  if (plan.duration === "quarterly") {
    newExpiry.setDate(baseDate.getDate() + 90);
  }

  if (plan.duration === "semi_annual") {
    newExpiry.setDate(baseDate.getDate() + 180);
  }

  if (plan.duration === "annual") {
    newExpiry.setDate(baseDate.getDate() + 365);
  }

  // Add outstanding balance
  baseAmount += Number(membership.outstanding_balance || 0);

  // Apply freeze discount
  const dailyRate = plan.price / 30;

const freezeDiscount = dailyRate * freezeDays;

const amountDue = Math.max(plan.price - freezeDiscount, 0);
return {
  amountDue,
  newExpiry,
  freezeDiscount
};

}

