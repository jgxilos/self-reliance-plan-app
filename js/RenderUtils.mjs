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
 */
export function renderNeedsSummary(summary = {}) {
  setText("#s1-total-gap", summary.formattedGap || "$0.00");
  setText("#s1-imm-count", `${summary.immediateCount ?? 0} selected`);
  setText("#s1-lt-count", `${summary.longTermCount ?? 0} selected`);
}

/**
 * Renders Step 2 budget totals, net balance card, and sidebar balance readout.
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

/**
 * Populates the 2-page official Self-Reliance Plan print template from current form inputs.
 */
export function populateOfficialPrintForm() {
  const getVal = (sel) => (queryOne(sel)?.value || "").trim();
  const getNum = (sel) => {
    const raw = Number.parseFloat(queryOne(sel)?.value);
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  };

  // Member Name (Page 1 & Page 2)
  const memberName = getVal("#s0-fullname");
  setText("#print-member-name", memberName);
  setText("#print-member-name-p2", memberName);

  // Step 1: Needs
  const immChips = queryAll(".imm-chip:checked")
    .map((cb) => cb.parentElement?.textContent.trim())
    .filter(Boolean);
  const ltChips = queryAll(".lt-chip:checked")
    .map((cb) => cb.parentElement?.textContent.trim())
    .filter(Boolean);
  const immDesc = getVal("#s1-imm-desc");
  const ltDesc = getVal("#s1-lt-desc");

  const step1Lines = [];
  if (immChips.length || immDesc) {
    step1Lines.push(`Immediate needs: ${[immChips.join(", "), immDesc].filter(Boolean).join(" — ")}`);
  }
  if (ltChips.length || ltDesc) {
    step1Lines.push(`Longer-term needs: ${[ltChips.join(", "), ltDesc].filter(Boolean).join(" — ")}`);
  }
  setText("#print-step1-needs", step1Lines.join("\n\n"));

  // Step 2: Income
  const incFamily = getNum("#inc-wages");
  const incOther = getNum("#inc-other");
  const incGov = getNum("#inc-aid");
  const incTotal = incFamily + incOther + incGov;

  setText("#print-inc-family", formatCurrency(incFamily));
  setText("#print-inc-other", formatCurrency(incOther));
  setText("#print-inc-gov", formatCurrency(incGov));
  setText("#print-inc-total", formatCurrency(incTotal));

  // Step 2: Base Expenses
  const expTithes = getNum("#exp-tithes");
  const expFood = getNum("#exp-food");
  const expHousing = getNum("#exp-housing");
  const expUtilities = getNum("#exp-utilities");
  const expMedical = getNum("#exp-medical");
  const expTransport = getNum("#exp-transport");
  const expEducation = getNum("#exp-edu");
  const expDebt = getNum("#exp-debt");
  const expClothing = getNum("#exp-other");

  setText("#print-exp-tithes", formatCurrency(expTithes));
  setText("#print-exp-food", formatCurrency(expFood));
  setText("#print-exp-housing", formatCurrency(expHousing));
  setText("#print-exp-water", "$0.00");
  setText("#print-exp-medical", formatCurrency(expMedical));
  setText("#print-exp-transport", formatCurrency(expTransport));
  setText("#print-exp-education", formatCurrency(expEducation));
  setText("#print-exp-debt", formatCurrency(expDebt));
  setText("#print-exp-clothing", formatCurrency(expClothing));
  setText("#print-exp-utilities", formatCurrency(expUtilities));

  // Custom expenses -> up to 4 "Other (specify)" rows
  const customRows = queryAll(".custom-exp-row");
  let customSum = 0;
  for (let i = 0; i < 4; i += 1) {
    const row = customRows[i];
    const labelEl = queryOne(`#print-other-label-${i + 1}`);
    const valEl = queryOne(`#print-other-val-${i + 1}`);
    if (row) {
      const lbl = queryOne(".custom-exp-label", row)?.value.trim() || "Other (specify)";
      const amt = Number.parseFloat(queryOne(".custom-exp-amount", row)?.value) || 0;
      const safeAmt = amt > 0 ? amt : 0;
      customSum += safeAmt;
      if (labelEl) labelEl.textContent = lbl;
      if (valEl) valEl.textContent = safeAmt > 0 ? formatCurrency(safeAmt) : "";
    } else {
      if (labelEl) labelEl.textContent = "Other (specify)";
      if (valEl) valEl.textContent = "";
    }
  }

  const baseSum =
    expTithes +
    expFood +
    expHousing +
    expUtilities +
    expMedical +
    expTransport +
    expEducation +
    expDebt +
    expClothing;
  setText("#print-exp-total", formatCurrency(baseSum + customSum));

  // Reducible expenses note
  const reducibleNote = getVal("#s2-adjustments");
  setText("#print-red-label-1", reducibleNote || "\u00A0");
  setText("#print-red-label-2", "\u00A0");
  setText("#print-red-label-3", "\u00A0");
  setText("#print-red-val-1", "");
  setText("#print-red-val-2", "");
  setText("#print-red-val-3", "");
  setText("#print-red-total", formatCurrency(0));

  // Step 3: Other Resources
  const skillsList = queryAll("#s3-skills-tbody tr")
    .map((tr) => {
      const name = queryOne(".skill-name", tr)?.value.trim();
      const avail = queryOne(".skill-avail", tr)?.value.trim();
      return name ? `${name}${avail ? ` (${avail})` : ""}` : "";
    })
    .filter(Boolean);

  const materialsList = queryAll("#s3-material-rows .resource-item")
    .filter((row) => queryOne(".res-active", row)?.checked)
    .map((row) => queryOne(".res-title", row)?.textContent.trim())
    .filter(Boolean);

  setText("#print-step3-individual", [...skillsList, ...materialsList].join(" · "));
  setText("#print-step3-family", getVal("#s3-plan"));
  setText(
    "#print-step3-community",
    queryAll(".net-check:checked")
      .map((cb) => cb.parentElement?.textContent.trim())
      .filter(Boolean)
      .join(", ")
  );

  // Step 4: Action Table (6 rows)
  const goalGoal = getVal("#s4-p1-goal");
  const actionRows = queryAll("#s4-actions-tbody tr");
  const printTbody = queryOne("#print-step4-tbody");
  if (printTbody) {
    const targetRows = queryAll("tr", printTbody);
    targetRows.forEach((tr, idx) => {
      const cells = queryAll("td", tr);
      const srcRow = actionRows[idx];
      const task = srcRow ? queryOne(".act-task", srcRow)?.value.trim() : "";
      const owner = srcRow ? queryOne(".act-owner", srcRow)?.value.trim() : "";
      const date = srcRow ? queryOne(".act-date", srcRow)?.value.trim() : "";

      if (cells[0]) cells[0].textContent = idx === 0 && goalGoal ? goalGoal : owner;
      if (cells[1]) cells[1].textContent = task;
      if (cells[2]) cells[2].textContent = date;
    });
  }

  // Step 5: Work or Service
  setText("#print-step5-ideas", getVal("#s5-pre-notes"));
  setText("#print-step5-assignment", getVal("#s5-agreed-desc"));

  // Commitment & Dates
  setText("#print-member-sign", getVal("#s6-sig-member") || memberName);
  setText("#print-member-date", getVal("#s6-date-member") || getVal("#s0-start-date"));
  setText("#print-spouse-sign", getVal("#s6-sig-spouse"));
  setText("#print-spouse-date", getVal("#s6-date-spouse"));
}