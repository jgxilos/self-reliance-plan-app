// SelfReliancePath: Self-Reliance Plan
// Financial & Resource Calculation Module (US English, USD)

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

/**
 * Formats a numeric value as US dollars ($1,234.56).
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrency(amount) {
  const numeric = Number(amount);
  const safe = Number.isFinite(numeric) ? numeric : 0;
  return CURRENCY_FORMATTER.format(safe);
}

/**
 * Sums an array of numeric inputs safely.
 * @param {Array<number|string>} values
 * @returns {number}
 */
export function sumAmounts(values = []) {
  if (!Array.isArray(values)) return 0;
  return values.reduce((acc, val) => {
    const num = Number.parseFloat(val);
    return acc + (Number.isFinite(num) && num > 0 ? num : 0);
  }, 0);
}

/**
 * Calculates Step 1 needs diagnostic totals and selection counts.
 * @param {{
 *   gapAmounts?: Array<number|string>,
 *   immediateCount?: number,
 *   longTermCount?: number
 * }} [params]
 */
export function calculateNeedsSummary(params = {}) {
  const totalGap = sumAmounts(params.gapAmounts || []);
  const immediateCount = Math.max(0, Number.parseInt(params.immediateCount ?? 0, 10) || 0);
  const longTermCount = Math.max(0, Number.parseInt(params.longTermCount ?? 0, 10) || 0);

  return {
    totalGap,
    formattedGap: formatCurrency(totalGap),
    immediateCount,
    longTermCount
  };
}

/**
 * Calculates Step 2 monthly income, expenses, net balance, and status badge.
 * @param {{
 *   incomeAmounts?: Array<number|string>,
 *   expenseAmounts?: Array<number|string>
 * }} [params]
 */
export function calculateBudgetSummary(params = {}) {
  const totalIncome = sumAmounts(params.incomeAmounts || []);
  const totalExpenses = sumAmounts(params.expenseAmounts || []);
  const netBalance = totalIncome - totalExpenses;

  let status = "balanced";
  let badgeLabel = "Balanced";
  let description = "Monthly income matches estimated expenses.";

  if (netBalance > 0.005) {
    status = "surplus";
    badgeLabel = "Positive Surplus";
    description = "Monthly income exceeds estimated expenses.";
  } else if (netBalance < -0.005) {
    status = "deficit";
    badgeLabel = "Monthly Deficit";
    description = "Estimated expenses exceed monthly income; review adjustments in Step 3.";
  }

  const absFormatted = formatCurrency(Math.abs(netBalance));
  const signedNet =
    netBalance < -0.005 ? `-${absFormatted}` : netBalance > 0.005 ? `+${absFormatted}` : "$0.00";

  return {
    totalIncome,
    totalExpenses,
    netBalance,
    status,
    badgeLabel,
    description,
    formattedIncome: `${formatCurrency(totalIncome)} USD`,
    formattedExpenses: `${formatCurrency(totalExpenses)} USD`,
    formattedNet: signedNet,
    formattedNetMonthly: `${signedNet} / mo`
  };
}

/**
 * Calculates Step 3 material reserves, support selections, and monthly skill potential.
 * @param {{
 *   materialItems?: Array<{ active?: boolean, value?: number|string }>,
 *   skillPotentials?: Array<number|string>,
 *   supportCount?: number
 * }} [params]
 */
export function calculateResourcesSummary(params = {}) {
  const materials = Array.isArray(params.materialItems) ? params.materialItems : [];
  const activeMaterials = materials.filter((item) => Boolean(item?.active));
  const activeCount = activeMaterials.length;
  const materialTotal = sumAmounts(activeMaterials.map((item) => item.value ?? 0));

  const monthlyPotential = sumAmounts(params.skillPotentials || []);
  const supportCount = Math.max(0, Number.parseInt(params.supportCount ?? 0, 10) || 0);

  return {
    activeCount,
    materialTotal,
    monthlyPotential,
    supportCount,
    summaryLine: `${activeCount} active reserves · ${formatCurrency(materialTotal)} material value · ${supportCount} support options`,
    potentialLine: `Estimated monthly earning potential: ${formatCurrency(monthlyPotential)}`
  };
}