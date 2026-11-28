// SelfReliancePath: Self-Reliance Plan
// Main Application Orchestrator (ES6 Module, US English)

import {
  calculateNeedsSummary,
  calculateBudgetSummary,
  calculateResourcesSummary
} from "./BudgetCalculator.mjs";
import { StorageService } from "./StorageService.mjs";
import {
  renderContextHeaders,
  renderNeedsSummary,
  renderBudgetSummary,
  renderResourcesSummary,
  renderExecutiveSummary,
  createHouseholdRowElement,
  createCustomExpenseRowElement,
  createSkillRowElement,
  createActionRowElement,
  populateOfficialPrintForm
} from "./RenderUtils.mjs";
import { WizardController } from "./WizardController.mjs";
import { ExternalServices } from "./ExternalServices.mjs";

const AUTOSAVE_DELAY_MS = 350;
const RESET_CONFIRM_MESSAGE =
  "Are you sure you want to reset and clear the entire Self-Reliance Plan? All saved draft data in this browser will be removed.";

class SelfRelianceApp {
  constructor() {
    this.storage = new StorageService();
    this.externalServices = new ExternalServices();
    this.wizard = new WizardController({
      totalSteps: 7,
      initialStep: 0,
      onStepChange: (stepIndex) => {
        this.syncAllViews();
        this.scheduleAutosave({ step: stepIndex });
      }
    });
    this.saveTimer = null;
  }

  async init() {
    this.bindNavigationEvents();
    this.bindDynamicRowEvents();
    this.bindInputEvents();
    this.bindActionButtons();
    this.bindPrintEvents();

    const savedState = this.storage.loadPlan();
    if (savedState) {
      this.applySavedState(savedState);
      const statusEl = document.querySelector("#autosave-indicator");
      if (statusEl) {
        statusEl.textContent = this.storage.formatSavedStatus(savedState.updatedAt);
      }
    }

    this.syncAllViews();

    const initialStep = Number.isInteger(savedState?.currentStep) ? savedState.currentStep : 0;
    this.wizard.goToStep(initialStep, { scrollToTop: false });

    await this.loadExternalTips();
  }

  async loadExternalTips() {
    const tips = await this.externalServices.getReflectionTips();
    this.wizard.setTips(tips);
  }

  resetPlan() {
    const confirmed = window.confirm(RESET_CONFIRM_MESSAGE);
    if (!confirmed) return;

    window.clearTimeout(this.saveTimer);
    this.storage.clearPlan();
    this.wizard.finalized = false;

    // Reset standard inputs, selects, and textareas outside print template
    document.querySelectorAll("input[id], select[id], textarea[id]").forEach((el) => {
      if (el.closest("#official-print-document")) return;

      if (el.type === "checkbox" || el.type === "radio") {
        el.checked = false;
      } else if (el.tagName === "SELECT") {
        el.selectedIndex = 0;
      } else if (el.type === "number") {
        el.value = "0";
      } else {
        el.value = "";
      }
    });

    // Restore single blank row in dynamic tables and clear custom expense rows
    const householdTbody = document.querySelector("#s0-household-tbody");
    if (householdTbody) {
      householdTbody.innerHTML = "";
      householdTbody.appendChild(createHouseholdRowElement());
    }

    const customExpensesList = document.querySelector("#custom-expenses-list");
    if (customExpensesList) {
      customExpensesList.innerHTML = "";
    }

    const skillsTbody = document.querySelector("#s3-skills-tbody");
    if (skillsTbody) {
      skillsTbody.innerHTML = "";
      skillsTbody.appendChild(createSkillRowElement());
    }

    const actionsTbody = document.querySelector("#s4-actions-tbody");
    if (actionsTbody) {
      actionsTbody.innerHTML = "";
      actionsTbody.appendChild(createActionRowElement());
    }

    const statusEl = document.querySelector("#autosave-indicator");
    if (statusEl) {
      statusEl.textContent = "Plan cleared · Draft ready";
    }

    const finalStatusEl = document.querySelector("#s6-final-status");
    if (finalStatusEl) {
      finalStatusEl.textContent = "Ready to review and finalize";
    }

    const fileBadgeEl = document.querySelector("#file-status-badge");
    if (fileBadgeEl) {
      fileBadgeEl.textContent = "In Progress";
    }

    this.syncAllViews();
    this.wizard.goToStep(0);
  }

  bindNavigationEvents() {
    document.querySelectorAll(".stepper-item").forEach((item) => {
      item.addEventListener("click", () => {
        const step = Number.parseInt(item.dataset.step, 10);
        if (Number.isFinite(step)) {
          this.wizard.goToStep(step);
        }
      });
    });

    document.querySelectorAll(".btn-nav-next[data-next]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextStep = Number.parseInt(btn.dataset.next, 10);
        if (Number.isFinite(nextStep)) {
          this.wizard.goToStep(nextStep);
        }
      });
    });

    document.querySelectorAll(".btn-nav-prev[data-prev]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const prevStep = Number.parseInt(btn.dataset.prev, 10);
        if (Number.isFinite(prevStep)) {
          this.wizard.goToStep(prevStep);
        }
      });
    });

    const jumpStep2Btn = document.querySelector("#btn-jump-step2");
    if (jumpStep2Btn) {
      jumpStep2Btn.addEventListener("click", () => this.wizard.goToStep(2));
    }
  }

  bindDynamicRowEvents() {
    document.querySelector("#btn-add-household")?.addEventListener("click", () => {
      const tbody = document.querySelector("#s0-household-tbody");
      if (tbody) {
        tbody.appendChild(createHouseholdRowElement());
        this.syncAllViews();
        this.scheduleAutosave();
      }
    });

    document.querySelector("#btn-add-expense")?.addEventListener("click", () => {
      const container = document.querySelector("#custom-expenses-list");
      if (container) {
        container.appendChild(createCustomExpenseRowElement());
        this.syncAllViews();
        this.scheduleAutosave();
      }
    });

    document.querySelector("#btn-add-skill")?.addEventListener("click", () => {
      const tbody = document.querySelector("#s3-skills-tbody");
      if (tbody) {
        tbody.appendChild(createSkillRowElement());
        this.syncAllViews();
        this.scheduleAutosave();
      }
    });

    document.querySelector("#btn-add-action")?.addEventListener("click", () => {
      const tbody = document.querySelector("#s4-actions-tbody");
      if (tbody) {
        tbody.appendChild(createActionRowElement());
        this.syncAllViews();
        this.scheduleAutosave();
      }
    });

    document.addEventListener("click", (event) => {
      const delBtn = event.target.closest(".btn-row-del");
      if (!delBtn) return;

      const row = delBtn.closest("tr, .custom-exp-row");
      const parent = row?.parentElement;
      if (!row || !parent) return;

      if (parent.tagName === "TBODY" && parent.children.length <= 1) {
        row.querySelectorAll("input, select").forEach((field) => {
          if (field.type === "number") field.value = "0";
          else if (field.tagName === "SELECT") field.selectedIndex = 0;
          else field.value = "";
        });
      } else {
        row.remove();
      }

      this.syncAllViews();
      this.scheduleAutosave();
    });
  }

  bindInputEvents() {
    const handleFormChange = () => {
      this.syncAllViews();
      this.scheduleAutosave();
    };

    document.addEventListener("input", handleFormChange);
    document.addEventListener("change", handleFormChange);
  }

  bindActionButtons() {
    document.querySelector("#btn-new-tip")?.addEventListener("click", () => {
      this.wizard.cycleTip();
    });

    document.querySelector("#btn-reset-plan")?.addEventListener("click", () => {
      this.resetPlan();
    });

    document.querySelector("#btn-finalize-plan")?.addEventListener("click", () => {
      const result = this.wizard.finalizePlan();
      this.scheduleAutosave({ finalized: result.valid });
    });

    document.querySelector("#link-top")?.addEventListener("click", (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  bindPrintEvents() {
    const triggerOfficialPrint = (event) => {
      if (event) event.preventDefault();
      this.syncAllViews();
      populateOfficialPrintForm();
      window.print();
    };

    window.addEventListener("beforeprint", () => {
      this.syncAllViews();
      populateOfficialPrintForm();
    });

    document.querySelector("#btn-print-view")?.addEventListener("click", triggerOfficialPrint);
    document.querySelector("#btn-footer-print")?.addEventListener("click", triggerOfficialPrint);
  }

  collectFormState() {
    const val = (sel) => document.querySelector(sel)?.value ?? "";
    const checked = (sel) => Boolean(document.querySelector(sel)?.checked);

    const fields = {};
    document.querySelectorAll("input[id], select[id], textarea[id]").forEach((el) => {
      if (el.closest("#official-print-document")) return;
      fields[el.id] = el.type === "checkbox" ? el.checked : el.value;
    });

    const householdRows = Array.from(document.querySelectorAll("#s0-household-tbody tr")).map((tr) => ({
      name: tr.querySelector(".hh-name")?.value ?? "",
      rel: tr.querySelector(".hh-rel")?.value ?? "",
      age: tr.querySelector(".hh-age")?.value ?? "",
      occ: tr.querySelector(".hh-occ")?.value ?? ""
    }));

    const customExpenses = Array.from(document.querySelectorAll(".custom-exp-row")).map((row) => ({
      label: row.querySelector(".custom-exp-label")?.value ?? "",
      amount: row.querySelector(".custom-exp-amount")?.value ?? "0"
    }));

    const skills = Array.from(document.querySelectorAll("#s3-skills-tbody tr")).map((tr) => ({
      name: tr.querySelector(".skill-name")?.value ?? "",
      avail: tr.querySelector(".skill-avail")?.value ?? "",
      pot: tr.querySelector(".skill-pot")?.value ?? "0"
    }));

    const actions = Array.from(document.querySelectorAll("#s4-actions-tbody tr")).map((tr) => ({
      task: tr.querySelector(".act-task")?.value ?? "",
      owner: tr.querySelector(".act-owner")?.value ?? "",
      date: tr.querySelector(".act-date")?.value ?? "",
      status: tr.querySelector(".act-status")?.value ?? "In Progress"
    }));

    return {
      currentStep: this.wizard.currentStep,
      finalized: this.wizard.finalized,
      fields,
      householdRows,
      customExpenses,
      skills,
      actions,
      meta: {
        memberName: val("#s0-fullname"),
        startDate: val("#s0-start-date"),
        ward: val("#s0-ward"),
        stake: val("#s0-stake"),
        specialist: val("#s0-specialist"),
        confirmAccurate: checked("#s6-confirm-accurate"),
        confirmFollowup: checked("#s6-confirm-followup")
      }
    };
  }

  applySavedState(state) {
    if (!state || typeof state !== "object") return;

    if (Array.isArray(state.householdRows) && state.householdRows.length > 0) {
      const tbody = document.querySelector("#s0-household-tbody");
      if (tbody) {
        tbody.innerHTML = "";
        state.householdRows.forEach((item) => {
          const tr = createHouseholdRowElement();
          tr.querySelector(".hh-name").value = item.name ?? "";
          tr.querySelector(".hh-rel").value = item.rel ?? "";
          tr.querySelector(".hh-age").value = item.age ?? "";
          tr.querySelector(".hh-occ").value = item.occ ?? "";
          tbody.appendChild(tr);
        });
      }
    }

    if (Array.isArray(state.customExpenses) && state.customExpenses.length > 0) {
      const container = document.querySelector("#custom-expenses-list");
      if (container) {
        container.innerHTML = "";
        state.customExpenses.forEach((item) => {
          const row = createCustomExpenseRowElement();
          row.querySelector(".custom-exp-label").value = item.label ?? "";
          row.querySelector(".custom-exp-amount").value = item.amount ?? "0";
          container.appendChild(row);
        });
      }
    }

    if (Array.isArray(state.skills) && state.skills.length > 0) {
      const tbody = document.querySelector("#s3-skills-tbody");
      if (tbody) {
        tbody.innerHTML = "";
        state.skills.forEach((item) => {
          const tr = createSkillRowElement();
          tr.querySelector(".skill-name").value = item.name ?? "";
          tr.querySelector(".skill-avail").value = item.avail ?? "";
          tr.querySelector(".skill-pot").value = item.pot ?? "0";
          tbody.appendChild(tr);
        });
      }
    }

    if (Array.isArray(state.actions) && state.actions.length > 0) {
      const tbody = document.querySelector("#s4-actions-tbody");
      if (tbody) {
        tbody.innerHTML = "";
        state.actions.forEach((item) => {
          const tr = createActionRowElement();
          tr.querySelector(".act-task").value = item.task ?? "";
          tr.querySelector(".act-owner").value = item.owner ?? "";
          tr.querySelector(".act-date").value = item.date ?? "";
          if (item.status) tr.querySelector(".act-status").value = item.status;
          tbody.appendChild(tr);
        });
      }
    }

    if (state.fields && typeof state.fields === "object") {
      Object.entries(state.fields).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === "checkbox") {
          el.checked = Boolean(value);
        } else {
          el.value = value ?? "";
        }
      });
    }

    if (state.finalized) {
      this.wizard.finalizePlan();
    }
  }

  syncAllViews() {
    const memberName = document.querySelector("#s0-fullname")?.value ?? "";
    const startDate = document.querySelector("#s0-start-date")?.value ?? "";
    const ward = document.querySelector("#s0-ward")?.value ?? "";
    const stake = document.querySelector("#s0-stake")?.value ?? "";
    const specialist = document.querySelector("#s0-specialist")?.value ?? "";

    const extraDependents = Array.from(document.querySelectorAll("#s0-household-tbody tr"))
      .filter((tr) => {
        const nameVal = tr.querySelector(".hh-name")?.value.trim();
        const relVal = tr.querySelector(".hh-rel")?.value.trim();
        const ageVal = tr.querySelector(".hh-age")?.value.trim();
        return Boolean(nameVal || relVal || (ageVal && Number(ageVal) > 0));
      }).length;

    const householdCount = (memberName.trim() ? 1 : 0) + extraDependents;

    renderContextHeaders({
      memberName,
      startDate,
      ward,
      stake,
      specialist,
      householdCount: Math.max(1, householdCount)
    });

    const needsGapAmounts = Array.from(document.querySelectorAll(".s1-calc")).map(
      (inp) => Number.parseFloat(inp.value) || 0
    );
    const immediateCount = document.querySelectorAll(".imm-chip:checked").length;
    const longTermCount = document.querySelectorAll(".lt-chip:checked").length;

    renderNeedsSummary(
      calculateNeedsSummary({
        gapAmounts: needsGapAmounts,
        immediateCount,
        longTermCount
      })
    );

    const incomeAmounts = Array.from(document.querySelectorAll(".inc-input")).map(
      (inp) => Number.parseFloat(inp.value) || 0
    );
    const baseExpenseAmounts = Array.from(document.querySelectorAll(".exp-input")).map(
      (inp) => Number.parseFloat(inp.value) || 0
    );
    const customExpenseAmounts = Array.from(document.querySelectorAll(".custom-exp-amount")).map(
      (inp) => Number.parseFloat(inp.value) || 0
    );

    const budgetSummary = calculateBudgetSummary({
      incomeAmounts,
      expenseAmounts: [...baseExpenseAmounts, ...customExpenseAmounts]
    });
    renderBudgetSummary(budgetSummary);

    const materialItems = Array.from(document.querySelectorAll("#s3-material-rows .resource-item")).map(
      (row) => ({
        active: Boolean(row.querySelector(".res-active")?.checked),
        value: Number.parseFloat(row.querySelector(".res-val")?.value) || 0
      })
    );
    const skillPotentials = Array.from(document.querySelectorAll("#s3-skills-tbody .skill-pot")).map(
      (inp) => Number.parseFloat(inp.value) || 0
    );
    const supportCount = document.querySelectorAll(".net-check:checked").length;

    renderResourcesSummary(
      calculateResourcesSummary({
        materialItems,
        skillPotentials,
        supportCount
      })
    );

    const goalTitle = document.querySelector("#s4-p1-goal")?.value ?? "";
    const goalTarget = Number.parseFloat(document.querySelector("#s4-p1-target")?.value) || 0;
    const serviceHours = Number.parseFloat(document.querySelector("#s5-hours")?.value) || 0;
    const serviceDescription = document.querySelector("#s5-agreed-desc")?.value ?? "";
    const mentorName = document.querySelector("#s4-mentor")?.value ?? "";
    const followUpFrequency = document.querySelector("#s4-check-freq")?.value ?? "";

    renderExecutiveSummary({
      budget: budgetSummary,
      goalTitle,
      goalTarget,
      serviceHours,
      serviceDescription,
      mentorName,
      followUpFrequency
    });
  }

  scheduleAutosave(extra = {}) {
    window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      const snapshot = {
        ...this.collectFormState(),
        ...extra
      };
      const result = this.storage.savePlan(snapshot);
      const indicator = document.querySelector("#autosave-indicator");
      if (indicator && result.success) {
        indicator.textContent = this.storage.formatSavedStatus(result.savedAt);
      }
    }, AUTOSAVE_DELAY_MS);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new SelfRelianceApp();
  app.init();
});