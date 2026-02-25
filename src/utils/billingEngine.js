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

export function calculateRenewal({
  membership,
  plan,
  today,
  freezeDays = 0,
}) {
  const isExpired = new Date(today) > new Date(membership.expiry_date);

  let baseAmount = 0;
  let newExpiry;

  const durationMonths = getDurationMonths(plan.duration);

  // MONTHLY PLAN
  if (plan.duration === "monthly") {
    if (isExpired) {
      const result = calculateMonthlyProrate(plan.price, today);
      baseAmount = result.baseAmount;
      newExpiry = result.expiryDate;
    } else {
      baseAmount = plan.price;

      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      newExpiry = getLastDayOfMonth(nextMonth);
    }
  } else {
    // LONG TERM PLANS
    baseAmount = plan.price;

    const nextCycle = new Date(today);
    nextCycle.setMonth(nextCycle.getMonth() + durationMonths);
    newExpiry = getLastDayOfMonth(nextCycle);
  }

  // Add outstanding balance
  baseAmount += Number(membership.outstanding_balance || 0);

  // Apply freeze discount
  const freezeDiscount = calculateFreezeDiscount({
    freezeDays,
    planPrice: plan.price,
    duration: plan.duration,
    referenceDate: today,
  });

  const finalAmount = baseAmount - freezeDiscount;

  return {
    amountDue: Math.max(finalAmount, 0),
    newExpiry,
    freezeDiscount,
  };
}

