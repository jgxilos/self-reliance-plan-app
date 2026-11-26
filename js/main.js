// SelfReliancePath: Self-Reliance Plan
// Main interactive controller (US English, connected to BudgetCalculator.mjs)

import {
  calculateMonthlyBudget,
  calculateNeedsSummary,
  calculateResourcesSummary,
  formatCurrency,
  parseAmount
} from "./BudgetCalculator.mjs";

const REFLECTION_TIPS = [
  {
    quote: "“Plan carefully and work diligently toward steady improvement, building strength step by step.”",
    heading: "Principle of self-reliance",
    body: "Honest assessment of current needs, income, and resources lays a clear foundation for lasting stability."
  },
  {
    quote: "“Small, consistent habits practiced every week produce lasting results over time.”",
    heading: "Practical budgeting tip",
    body: "Track every dollar spent for two weeks to spot small leaks and adjust your monthly plan with confidence."
  },
  {
    quote: "“Faith paired with focused effort helps turn practical skills into reliable opportunities.”",
    heading: "Skills and initiative",
    body: "List everyday talents, tools, and community connections—unused strengths often help bridge short-term gaps."
  },
  {
    quote: "“Service given with dignity strengthens both the giver and the broader community.”",
    heading: "Reciprocity and service",
    body: "Align your service commitment with your realistic schedule and abilities so it remains sustainable."
  }
];

const TOTAL_STEPS = 7;

const state = {
  currentStep: 0,
  tipIndex: 0,
  finalized: false
};

// ============================================================================
// DOM Helpers
// ============================================================================
function $(selector, root = document) {
  return root.querySelector(selector);
}

function $$(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

// ============================================================================
// Step Navigation & Progress
// ============================================================================
function setActiveStep(stepIndex) {
  const clamped = Math.max(0, Math.min(TOTAL_STEPS - 1, Number(stepIndex) || 0));
  state.currentStep = clamped;

  $$(".step-view").forEach((view) => {
    const viewStep = Number(view.dataset.step);
    view.classList.toggle("active", viewStep === clamped);
  });

  $$(".stepper-item").forEach((item) => {
    const itemStep = Number(item.dataset.step);
    const stateEl = $(".stepper-state", item);
    item.classList.remove("active", "completed");

    if (itemStep === clamped) {
      item.classList.add("active");
      if (stateEl) stateEl.textContent = itemStep === 6 ? "FINAL STEP" : "IN PROGRESS";
    } else if (itemStep < clamped) {
      item.classList.add("completed");
      if (stateEl) stateEl.textContent = "COMPLETED";
    } else if (stateEl) {
      stateEl.textContent = itemStep === 6 ? "FINAL" : "PENDING";
    }
  });

  updateProgressSummary();
  updateExecutiveSummary();

  const workspaceTop = $(".main-workspace");
  if (workspaceTop) {
    workspaceTop.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function updateProgressSummary() {
  const percent = Math.round(((state.currentStep + 1) / TOTAL_STEPS) * 100);
  const completedCount = state.currentStep + 1;

  const badge = $("#sidebar-progress-percent");
  const countText = $("#sidebar-sections-count");
  const fill = $("#sidebar-progress-fill");
  const fileSections = $("#file-sections-val");

  if (badge) badge.textContent = `${percent}%`;
  if (countText) countText.textContent = `${completedCount} of ${TOTAL_STEPS} stages active`;
  if (fill) fill.style.width = `${percent}%`;
  if (fileSections) fileSections.textContent = `${state.currentStep} of 6 steps`;
}

// ============================================================================
// Context Sync Across Steps
// ============================================================================
function syncContextHeaders() {
  const memberName = ($("#s0-fullname")?.value || "").trim() || "Not entered";
  const startDate = $("#s0-start-date")?.value || "Not set";
  const ward = ($("#s0-ward")?.value || "").trim() || "Not specified";
  const stake = ($("#s0-stake")?.value || "").trim() || "Not specified";
  const specialist = ($("#s0-specialist")?.value || "").trim();

  const hhRows = $$("#s0-household-tbody tr").length;
  const totalHousehold = 1 + hhRows;
  const householdLabel = `${totalHousehold} ${totalHousehold === 1 ? "person" : "people"}`;

  if ($("#ctx-member-0")) $("#ctx-member-0").textContent = memberName;
  if ($("#ctx-date-0")) $("#ctx-date-0").textContent = startDate;
  if ($("#ctx-unit-0")) $("#ctx-unit-0").textContent = ward;
  if ($("#ctx-stake-0")) $("#ctx-stake-0").textContent = stake;
  if ($("#household-count-pill")) $("#household-count-pill").textContent = `Total: ${householdLabel}`;

  $$(".sync-member-name").forEach((el) => {
    el.textContent = memberName === "Not entered" ? "[Member Name]" : memberName;
  });
  $$(".sync-date").forEach((el) => {
    el.textContent = startDate;
  });
  $$(".sync-unit").forEach((el) => {
    el.textContent = ward;
  });
  $$(".sync-household").forEach((el) => {
    el.textContent = householdLabel;
  });

  if ($("#specialist-name") && specialist) {
    $("#specialist-name").textContent = specialist;
  }
}

// ============================================================================
// Step 1, Step 2 & Step 3 Calculations (via BudgetCalculator.mjs)
// ============================================================================
function recalculateStep1() {
  const summary = calculateNeedsSummary({
    food: $("#s1-imm-food")?.value,
    housing: $("#s1-imm-housing")?.value,
    health: $("#s1-imm-health")?.value,
    immediateSelectedCount: $$(".imm-chip:checked").length,
    longTermSelectedCount: $$(".lt-chip:checked").length
  });

  if ($("#s1-total-gap")) $("#s1-total-gap").textContent = summary.formattedGap;
  if ($("#s1-imm-count")) $("#s1-imm-count").textContent = `${summary.immediateCount} selected`;
  if ($("#s1-lt-count")) $("#s1-lt-count").textContent = `${summary.longTermCount} selected`;
}

function recalculateBudget() {
  const budget = calculateMonthlyBudget({
    incomes: $$(".inc-input").map((input) => input.value),
    baseExpenses: $$(".exp-input").map((input) => input.value),
    customExpenses: $$(".custom-exp-amount").map((input) => input.value)
  });

  if ($("#s2-total-income")) $("#s2-total-income").textContent = budget.formattedIncome;
  if ($("#s2-total-expenses")) $("#s2-total-expenses").textContent = budget.formattedExpenses;

  const netEl = $("#s2-net-amount");
  const pillEl = $("#s2-balance-pill");
  const noteEl = $("#s2-balance-note");
  const cardEl = $("#s2-net-card");
  const fileBalanceEl = $("#file-balance-val");

  if (netEl) netEl.textContent = budget.formattedNet;
  if (fileBalanceEl) fileBalanceEl.textContent = budget.formattedNetMonthly;

  if (cardEl) {
    cardEl.classList.remove("surplus", "deficit");
    if (budget.status === "surplus") cardEl.classList.add("surplus");
    if (budget.status === "deficit") cardEl.classList.add("deficit");
  }

  if (pillEl) pillEl.textContent = budget.badgeLabel;
  if (noteEl) noteEl.textContent = budget.description;

  updateExecutiveSummary();
}

function recalculateResources() {
  const materialRows = $$("#s3-material-rows .resource-item");
  const activeMaterialCount = materialRows.filter((row) => $(".res-active", row)?.checked).length;
  const materialValues = materialRows.map((row) => $(".res-val", row)?.value);
  const skillPotentials = $$(".skill-pot").map((input) => input.value);
  const networkSelectedCount = $$(".net-check:checked").length;

  const summary = calculateResourcesSummary({
    activeMaterialCount,
    materialValues,
    skillPotentials,
    networkSelectedCount
  });

  if ($("#s3-summary-text")) $("#s3-summary-text").textContent = summary.summaryLine;
  if ($("#s3-potential-text")) $("#s3-potential-text").textContent = summary.potentialLine;
}

// ============================================================================
// Step 6 Executive Summary
// ============================================================================
function updateExecutiveSummary() {
  const budget = calculateMonthlyBudget({
    incomes: $$(".inc-input").map((input) => input.value),
    baseExpenses: $$(".exp-input").map((input) => input.value),
    customExpenses: $$(".custom-exp-amount").map((input) => input.value)
  });

  const goalTitle = ($("#s4-p1-goal")?.value || "").trim() || "Goal not yet specified";
  const goalTarget = parseAmount($("#s4-p1-target")?.value);
  const mentor = ($("#s4-mentor")?.value || "").trim() || "Mentor not assigned";
  const freq = ($("#s4-check-freq")?.value || "").trim() || "Schedule regular review with family and advisor.";

  const hours = parseAmount($("#s5-hours")?.value);
  const serviceDesc = ($("#s5-agreed-desc")?.value || "").trim() || "Service assignment details will appear here.";

  if ($("#exec-income-line")) $("#exec-income-line").textContent = `Monthly income: ${budget.formattedIncome}`;
  if ($("#exec-expense-line")) $("#exec-expense-line").textContent = `Monthly expenses: ${budget.formattedExpenses}`;
  if ($("#exec-net-line")) $("#exec-net-line").textContent = `Net balance: ${budget.formattedNetMonthly}`;
  if ($("#exec-budget-tag")) $("#exec-budget-tag").textContent = budget.badgeLabel;

  if ($("#exec-goal-title")) $("#exec-goal-title").textContent = goalTitle;
  if ($("#exec-goal-detail")) {
    $("#exec-goal-detail").textContent =
      goalTarget > 0 ? `Monthly target: ${formatCurrency(goalTarget)}` : "Define your target in Step 4.";
  }

  if ($("#exec-service-hours")) $("#exec-service-hours").textContent = `${hours} hours / month`;
  if ($("#exec-service-desc")) $("#exec-service-desc").textContent = serviceDesc;

  if ($("#exec-mentor-name")) $("#exec-mentor-name").textContent = mentor;
  if ($("#exec-followup-freq")) $("#exec-followup-freq").textContent = freq;

  if ($("#file-service-val")) {
    $("#file-service-val").textContent = hours > 0 ? `${hours} hrs / mo` : "Pending";
  }
}

// ============================================================================
// Dynamic Rows & Event Wiring
// ============================================================================
function attachRowDeleteListeners(container) {
  $$(".btn-row-del", container).forEach((btn) => {
    btn.onclick = () => {
      const tr = btn.closest("tr");
      const tbody = tr?.parentElement;
      if (tbody && tbody.children.length > 1) {
        tr.remove();
        syncContextHeaders();
        recalculateResources();
      } else if (tr) {
        $$("input", tr).forEach((inp) => {
          inp.value = inp.type === "number" ? "0" : "";
        });
        recalculateResources();
      }
    };
  });
}

function initDynamicTables() {
  $("#btn-add-household")?.addEventListener("click", () => {
    const tbody = $("#s0-household-tbody");
    if (!tbody) return;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="text" class="cell-input hh-name" placeholder="Member name" /></td>
      <td><input type="text" class="cell-input hh-rel" placeholder="Spouse / Child" /></td>
      <td><input type="number" class="cell-input hh-age" min="0" max="120" placeholder="0" /></td>
      <td><input type="text" class="cell-input hh-occ" placeholder="Job or school grade" /></td>
      <td class="th-center"><button type="button" class="btn-row-del" title="Remove row">✕</button></td>
    `;
    tbody.appendChild(tr);
    attachRowDeleteListeners(tbody);
    syncContextHeaders();
  });

  $("#btn-add-expense")?.addEventListener("click", () => {
    const list = $("#custom-expenses-list");
    if (!list) return;
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
    list.appendChild(row);

    $(".custom-exp-amount", row)?.addEventListener("input", recalculateBudget);
    $(".btn-row-del", row)?.addEventListener("click", () => {
      row.remove();
      recalculateBudget();
    });
  });

  $("#btn-add-skill")?.addEventListener("click", () => {
    const tbody = $("#s3-skills-tbody");
    if (!tbody) return;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="text" class="cell-input skill-name" placeholder="e.g., Home repairs, tutoring, baking" /></td>
      <td><input type="text" class="cell-input skill-avail" placeholder="e.g., Weekends (6 hrs/wk)" /></td>
      <td><input type="number" step="0.01" min="0" class="cell-input skill-pot" value="0" /></td>
      <td class="th-center"><button type="button" class="btn-row-del" title="Remove row">✕</button></td>
    `;
    tbody.appendChild(tr);
    $$("input", tr).forEach((inp) => inp.addEventListener("input", recalculateResources));
    attachRowDeleteListeners(tbody);
  });

  $("#btn-add-action")?.addEventListener("click", () => {
    const tbody = $("#s4-actions-tbody");
    if (!tbody) return;
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
    tbody.appendChild(tr);
    attachRowDeleteListeners(tbody);
  });

  ["#s0-household-tbody", "#s3-skills-tbody", "#s4-actions-tbody"].forEach((sel) => {
    const el = $(sel);
    if (el) attachRowDeleteListeners(el);
  });
}

function initNavigationAndActions() {
  $$(".stepper-item").forEach((item) => {
    item.addEventListener("click", () => {
      setActiveStep(item.dataset.step);
    });
  });

  $$(".btn-nav-next").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.id === "btn-finalize-plan") {
        const accurate = $("#s6-confirm-accurate")?.checked;
        const followup = $("#s6-confirm-followup")?.checked;
        const statusEl = $("#s6-final-status");
        const badgeEl = $("#file-status-badge");

        if (!accurate || !followup) {
          if (statusEl) {
            statusEl.textContent = "Please check both commitment boxes above before finalizing.";
          }
          return;
        }
        state.finalized = true;
        if (statusEl) {
          statusEl.textContent = "Plan reviewed and marked ready for family & advisor follow-up ✓";
        }
        if (badgeEl) {
          badgeEl.textContent = "Ready";
        }
        return;
      }
      if (btn.dataset.next !== undefined) {
        setActiveStep(btn.dataset.next);
      }
    });
  });

  $$(".btn-nav-prev").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.prev !== undefined) {
        setActiveStep(btn.dataset.prev);
      }
    });
  });

  $("#btn-jump-step2")?.addEventListener("click", () => setActiveStep(2));

  $("#btn-new-tip")?.addEventListener("click", () => {
    state.tipIndex = (state.tipIndex + 1) % REFLECTION_TIPS.length;
    const tip = REFLECTION_TIPS[state.tipIndex];
    if ($("#reflection-quote")) $("#reflection-quote").textContent = tip.quote;
    if ($("#principle-heading")) $("#principle-heading").textContent = tip.heading;
    if ($("#principle-body")) $("#principle-body").textContent = tip.body;
  });

  const triggerPrint = () => window.print();
  $("#btn-print-view")?.addEventListener("click", triggerPrint);
  $("#btn-footer-print")?.addEventListener("click", triggerPrint);

  $("#btn-call-specialist")?.addEventListener("click", () => {
    const contact = ($("#s0-bishop-phone")?.value || "").trim() || "your assigned specialist or ward leader";
    alert(`Contact info: ${contact}`);
  });

  $("#btn-msg-specialist")?.addEventListener("click", () => {
    const name = ($("#s0-specialist")?.value || "").trim() || "your Self-Reliance Specialist";
    alert(`Prepare your budget and action plan notes to share with ${name}.`);
  });

  ["#s0-fullname", "#s0-start-date", "#s0-ward", "#s0-stake", "#s0-specialist"].forEach((id) => {
    $(id)?.addEventListener("input", syncContextHeaders);
  });

  $$(".s1-calc, .imm-chip, .lt-chip").forEach((el) => {
    el.addEventListener("input", recalculateStep1);
    el.addEventListener("change", recalculateStep1);
  });

  $$(".inc-input, .exp-input").forEach((el) => {
    el.addEventListener("input", recalculateBudget);
  });

  $$(".res-active, .res-val, .skill-pot, .net-check").forEach((el) => {
    el.addEventListener("input", recalculateResources);
    el.addEventListener("change", recalculateResources);
  });

  ["#s4-p1-goal", "#s4-p1-target", "#s4-mentor", "#s4-check-freq", "#s5-hours", "#s5-agreed-desc"].forEach((id) => {
    $(id)?.addEventListener("input", updateExecutiveSummary);
  });
}

// ============================================================================
// Bootstrap
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  initDynamicTables();
  initNavigationAndActions();
  syncContextHeaders();
  recalculateStep1();
  recalculateBudget();
  recalculateResources();
  updateExecutiveSummary();
  setActiveStep(0);
});