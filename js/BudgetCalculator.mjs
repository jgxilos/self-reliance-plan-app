// SelfReliancePath: Self-Reliance Plan
// Pure financial & planning calculation module (US English / USD)

const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

/**
 * Formats a numeric value in US dollars ($1,234.56).
 * @param {number|string} amount
 * @param {{ includeCode?: boolean }} [options]
 * @returns {string}
 */
export function formatCurrency(amount, { includeCode = false } = {}) {
  const numeric = Number(amount);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;
  const formatted = USD_FORMATTER.format(safeValue);
  return includeCode ? `${formatted} USD` : formatted;
}

/**
 * Safely parses a non-negative number from user input.
 * @param {unknown} value
 * @returns {number}
 */
export function parseAmount(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,\s]/g, "").trim();
    if (!cleaned) return 0;
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }
  return 0;
}

/**
 * Sums an array of numeric or string values safely.
 * @param {Array<number|string>} values
 * @returns {number}
 */
export function sumAmounts(values = []) {
  if (!Array.isArray(values)) return 0;
  return values.reduce((total, item) => total + parseAmount(item), 0);
}

/**
 * Calculates Step 1 immediate needs summary.
 * @param {{
 *   food?: number|string,
 *   housing?: number|string,
 *   health?: number|string,
 *   immediateSelectedCount?: number,
 *   longTermSelectedCount?: number
 * }} params
 */
export function calculateNeedsSummary(params = {}) {
  const food = parseAmount(params.food);
  const housing = parseAmount(params.housing);
  const health = parseAmount(params.health);
  const immediateGap = sumAmounts([food, housing, health]);

  const immediateCount = Math.max(0, Math.floor(parseAmount(params.immediateSelectedCount)));
  const longTermCount = Math.max(0, Math.floor(parseAmount(params.longTermSelectedCount)));

  return {
    food,
    housing,
    health,
    immediateGap,
    immediateCount,
    longTermCount,
    totalSelectedAreas: immediateCount + longTermCount,
    formattedGap: formatCurrency(immediateGap)
  };
}

/**
 * Calculates monthly income, monthly expenses (base + custom), and net balance.
 * @param {{
 *   incomes?: Array<number|string>,
 *   baseExpenses?: Array<number|string>,
 *   customExpenses?: Array<number|string>
 * }} params
 */
export function calculateMonthlyBudget(params = {}) {
  const totalIncome = sumAmounts(params.incomes);
  const baseExpensesTotal = sumAmounts(params.baseExpenses);
  const customExpensesTotal = sumAmounts(params.customExpenses);
  const totalExpenses = sumAmounts([baseExpensesTotal, customExpensesTotal]);
  const netBalance = totalIncome - totalExpenses;

  let status = "balanced";
  let badgeLabel = "Balanced";
  let description = "Monthly income matches estimated expenses.";

  if (netBalance > 0) {
    status = "surplus";
    badgeLabel = "Positive Surplus";
    description = "Monthly income exceeds estimated expenses.";
  } else if (netBalance < 0) {
    status = "deficit";
    badgeLabel = "Monthly Deficit";
    description = "Expenses exceed income—review adjustments or resources.";
  }

  return {
    totalIncome,
    baseExpensesTotal,
    customExpensesTotal,
    totalExpenses,
    netBalance,
    status,
    badgeLabel,
    description,
    formattedIncome: formatCurrency(totalIncome, { includeCode: true }),
    formattedExpenses: formatCurrency(totalExpenses, { includeCode: true }),
    formattedNet: formatCurrency(netBalance),
    formattedNetMonthly: `${formatCurrency(netBalance)} / mo`
  };
}

/**
 * Calculates Step 3 reserves, active items, and monthly earning potential.
 * @param {{
 *   activeMaterialCount?: number,
 *   materialValues?: Array<number|string>,
 *   skillPotentials?: Array<number|string>,
 *   networkSelectedCount?: number
 * }} params
 */
export function calculateResourcesSummary(params = {}) {
  const activeMaterialCount = Math.max(0, Math.floor(parseAmount(params.activeMaterialCount)));
  const reservesTotal = sumAmounts(params.materialValues);
  const monthlyEarningPotential = sumAmounts(params.skillPotentials);
  const networkCount = Math.max(0, Math.floor(parseAmount(params.networkSelectedCount)));

  return {
    activeMaterialCount,
    reservesTotal,
    monthlyEarningPotential,
    networkCount,
    formattedReserves: formatCurrency(reservesTotal),
    formattedPotential: formatCurrency(monthlyEarningPotential),
    summaryLine: `${activeMaterialCount} active reserves · ${formatCurrency(reservesTotal)} material value · ${networkCount} support options`,
    potentialLine: `Estimated monthly earning potential: ${formatCurrency(monthlyEarningPotential)}`
  };
}