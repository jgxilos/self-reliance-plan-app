// SelfReliancePath: Self-Reliance Plan
// DOM Rendering & UI Synchronization Utilities (US English)

import { formatCurrency } from "./BudgetCalculator.mjs";

function queryOne(selector, root = document) {
  return root.querySelector(selector);
}

function queryAll(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

function setText(selector, text, root = document) {
  const el = queryOne(selector, root);
  if (el) {
    el.textContent = text;
  }
}

/**
 * Synchronizes member, date, unit, stake, household size, and specialist across views.
 * @param {{
 *   memberName?: string,
 *   startDate?: string,
 *   ward?: string,
 *   stake?: string,
 *   specialist?: string,
 *   householdCount?: number
 * }} context
 */
export function renderContextHeaders(context = {}) {
  const memberRaw = (context.memberName || "").trim();
  const displayMember = memberRaw || "Not entered";
  const statementMember = memberRaw || "[Member Name]";
  const displayDate = (context.startDate || "").trim() || "Not set";
  const displayWard = (context.ward || "").trim() || "Not specified";
  const displayStake = (context.stake || "").trim() || "Not specified";
  const specialistName = (context.specialist || "").trim();

  const totalHousehold = Math.max(1, Number(context.householdCount) || 1);
  const householdLabel = `${totalHousehold} ${totalHousehold === 1 ? "person" : "people"}`;

  setText("#ctx-member-0", displayMember);
  setText("#ctx-date-0", displayDate);
  setText("#ctx-unit-0", displayWard);
  setText("#ctx-stake-0", displayStake);
  setText("#household-count-pill", `Total: ${householdLabel}`);

  queryAll(".sync-member-name").forEach((el) => {
    el.textContent = statementMember;
  });
  queryAll(".sync-date").forEach((el) => {
    el.textContent = displayDate;
  });
  queryAll(".sync-unit").forEach((el) => {
    el.textContent = displayWard;
  });
  queryAll(".sync-household").forEach((el) => {
    el.textContent = householdLabel;
  });

  if (specialistName) {
    setText("#specialist-name", specialistName);
  }
}

/**
 * Renders Step 1 needs diagnostic summary cards.
 * @param {{
 *   formattedGap?: string,
 *   immediateCount?: number,
 *   longTermCount?: number
 * }} summary
 */
export function renderNeedsSummary(summary = {}) {
  setText("#s1-total-gap", summary.formattedGap || "$0.00");
  setText("#s1-imm-count", `${summary.immediateCount ?? 0} selected`);
  setText("#s1-lt-count", `${summary.longTermCount ?? 0} selected`);
}

/**
 * Renders Step 2 budget totals, net balance card, and sidebar balance readout.
 * @param {{
 *   formattedIncome?: string,
 *   formattedExpenses?: string,
 *   formattedNet?: string,
 *   formattedNetMonthly?: string,
 *   status?: "surplus" | "deficit" | "balanced",
 *   badgeLabel?: string,
 *   description?: string
 * }} budget
 */
export function renderBudgetSummary(budget = {}) {
  setText("#s2-total-income", budget.formattedIncome || "$0.00 USD");
  setText("#s2-total-expenses", budget.formattedExpenses || "$0.00 USD");
  setText("#s2-net-amount", budget.formattedNet || "$0.00");
  setText("#file-balance-val", budget.formattedNetMonthly || "$0.00 / mo");
  setText("#s2-balance-pill", budget.badgeLabel || "Balanced");
  setText("#s2-balance-note", budget.description || "Monthly income matches estimated expenses.");

  const cardEl = queryOne("#s2-net-card");
  if (cardEl) {
    cardEl.classList.remove("surplus", "deficit");
    if (budget.status === "surplus") cardEl.classList.add("surplus");
    if (budget.status === "deficit") cardEl.classList.add("deficit");
  }
}

/**
 * Renders Step 3 resource summary lines.
 * @param {{
 *   summaryLine?: string,
 *   potentialLine?: string
 * }} summary
 */
export function renderResourcesSummary(summary = {}) {
  setText(
    "#s3-summary-text",
    summary.summaryLine || "0 active reserves · $0.00 material value · 0 support options"
  );
  setText(
    "#s3-potential-text",
    summary.potentialLine || "Estimated monthly earning potential: $0.00"
  );
}

/**
 * Renders Step 6 Executive Summary cards and sidebar file status.
 * @param {{
 *   budget?: {
 *     formattedIncome?: string,
 *     formattedExpenses?: string,
 *     formattedNetMonthly?: string,
 *     badgeLabel?: string
 *   },
 *   goalTitle?: string,
 *   goalTarget?: number,
 *   serviceHours?: number,
 *   serviceDescription?: string,
 *   mentorName?: string,
 *   followUpFrequency?: string
 * }} execData
 */
export function renderExecutiveSummary(execData = {}) {
  const budget = execData.budget || {};
  const goalTitle = (execData.goalTitle || "").trim() || "Goal not yet specified";
  const goalTarget = Number(execData.goalTarget) || 0;
  const hours = Number(execData.serviceHours) || 0;
  const serviceDesc =
    (execData.serviceDescription || "").trim() || "Service assignment details will appear here.";
  const mentor = (execData.mentorName || "").trim() || "Mentor not assigned";
  const freq =
    (execData.followUpFrequency || "").trim() ||
    "Schedule regular review with family and advisor.";

  setText("#exec-income-line", `Monthly income: ${budget.formattedIncome || "$0.00 USD"}`);
  setText("#exec-expense-line", `Monthly expenses: ${budget.formattedExpenses || "$0.00 USD"}`);
  setText("#exec-net-line", `Net balance: ${budget.formattedNetMonthly || "$0.00 / mo"}`);
  setText("#exec-budget-tag", budget.badgeLabel || "Balanced");

  setText("#exec-goal-title", goalTitle);
  setText(
    "#exec-goal-detail",
    goalTarget > 0 ? `Monthly target: ${formatCurrency(goalTarget)}` : "Define your target in Step 4."
  );

  setText("#exec-service-hours", `${hours} hours / month`);
  setText("#exec-service-desc", serviceDesc);

  setText("#exec-mentor-name", mentor);
  setText("#exec-followup-freq", freq);

  setText("#file-service-val", hours > 0 ? `${hours} hrs / mo` : "Pending");
}

/**
 * Creates a table row element for household members (Step 0).
 * @returns {HTMLTableRowElement}
 */
export function createHouseholdRowElement() {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" class="cell-input hh-name" placeholder="Member name" /></td>
    <td><input type="text" class="cell-input hh-rel" placeholder="Spouse / Child" /></td>
    <td><input type="number" class="cell-input hh-age" min="0" max="120" placeholder="0" /></td>
    <td><input type="text" class="cell-input hh-occ" placeholder="Job or school grade" /></td>
    <td class="th-center"><button type="button" class="btn-row-del" title="Remove row">✕</button></td>
  `;
  return tr;
}

/**
 * Creates a custom monthly expense row element (Step 2).
 * @returns {HTMLDivElement}
 */
export function createCustomExpenseRowElement() {
  const row = document.createElement("div");
  row.className = "custom-exp-row";
  row.innerHTML = `
    <input type="text" class="cell-input custom-exp-label" placeholder="Additional monthly expense description" />
    <div class="currency-input">
      <span>$</span>
      <input type="number" step="0.01" min="0" class="custom-exp-amount" value="0" />
    </div>
    <button type="button" class="btn-row-del" title="Remove expense">✕</button>
  `;
  return row;
}

/**
 * Creates a table row element for skills/trades (Step 3).
 * @returns {HTMLTableRowElement}
 */
export function createSkillRowElement() {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" class="cell-input skill-name" placeholder="e.g., Home repairs, tutoring, baking" /></td>
    <td><input type="text" class="cell-input skill-avail" placeholder="e.g., Weekends (6 hrs/wk)" /></td>
    <td><input type="number" step="0.01" min="0" class="cell-input skill-pot" value="0" /></td>
    <td class="th-center"><button type="button" class="btn-row-del" title="Remove row">✕</button></td>
  `;
  return tr;
}

/**
 * Creates a table row element for action plan items (Step 4).
 * @returns {HTMLTableRowElement}
 */
export function createActionRowElement() {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" class="cell-input act-task" placeholder="Specific action step" /></td>
    <td><input type="text" class="cell-input act-owner" placeholder="Person responsible" /></td>
    <td><input type="date" class="cell-input act-date" /></td>
    <td>
      <select class="cell-input act-status">
        <option value="In Progress">In Progress</option>
        <option value="Pending">Pending</option>
        <option value="Scheduled">Scheduled</option>
        <option value="Completed">Completed</option>
      </select>
    </td>
    <td class="th-center"><button type="button" class="btn-row-del" title="Remove row">✕</button></td>
  `;
  return tr;
}