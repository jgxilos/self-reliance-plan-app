// SelfReliancePath: Self-Reliance Plan
// Multi-step wizard controller (Steps 0 to 6, US English)

const DEFAULT_TIPS = [
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

export class WizardController {
  /**
   * @param {{
   *   totalSteps?: number,
   *   initialStep?: number,
   *   tips?: Array<{ quote: string, heading: string, body: string }>,
   *   onStepChange?: (stepIndex: number) => void
   * }} [options]
   */
  constructor(options = {}) {
    this.totalSteps = options.totalSteps ?? 7;
    this.currentStep = this.clampStep(options.initialStep ?? 0);
    this.tips = Array.isArray(options.tips) && options.tips.length > 0
      ? options.tips
      : DEFAULT_TIPS;
    this.tipIndex = 0;
    this.finalized = false;
    this.onStepChange = typeof options.onStepChange === "function"
      ? options.onStepChange
      : null;
  }

  /**
   * Ensures any step index stays within [0, totalSteps - 1].
   * @param {number|string} step
   * @returns {number}
   */
  clampStep(step) {
    const parsed = Number.parseInt(step, 10);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.min(this.totalSteps - 1, parsed));
  }

  /**
   * Sets the active step, updates DOM views and stepper states, and triggers callback.
   * @param {number|string} stepIndex
   * @param {{ scrollToTop?: boolean }} [options]
   * @returns {number}
   */
  goToStep(stepIndex, { scrollToTop = true } = {}) {
    this.currentStep = this.clampStep(stepIndex);
    this.renderStepVisibility();
    this.renderStepper();
    this.renderProgressBar();

    if (scrollToTop) {
      const workspaceTop = document.querySelector(".main-workspace");
      if (workspaceTop) {
        workspaceTop.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    if (this.onStepChange) {
      this.onStepChange(this.currentStep);
    }

    return this.currentStep;
  }

  /**
   * Advances to the next step if not at the final step.
   * @returns {number}
   */
  nextStep() {
    return this.goToStep(this.currentStep + 1);
  }

  /**
   * Returns to the previous step if not at Step 0.
   * @returns {number}
   */
  prevStep() {
    return this.goToStep(this.currentStep - 1);
  }

  /**
   * Shows only the active step view in the main workspace.
   */
  renderStepVisibility() {
    const views = document.querySelectorAll(".step-view");
    views.forEach((view) => {
      const stepNum = Number.parseInt(view.dataset.step, 10);
      view.classList.toggle("active", stepNum === this.currentStep);
    });
  }

  /**
   * Updates the left sidebar stepper items (completed, active, pending/final).
   */
  renderStepper() {
    const items = document.querySelectorAll(".stepper-item");
    items.forEach((item) => {
      const itemStep = Number.parseInt(item.dataset.step, 10);
      const stateEl = item.querySelector(".stepper-state");
      item.classList.remove("active", "completed");

      if (itemStep === this.currentStep) {
        item.classList.add("active");
        if (stateEl) {
          stateEl.textContent = itemStep === this.totalSteps - 1 ? "FINAL STEP" : "IN PROGRESS";
        }
      } else if (itemStep < this.currentStep) {
        item.classList.add("completed");
        if (stateEl) {
          stateEl.textContent = "COMPLETED";
        }
      } else if (stateEl) {
        stateEl.textContent = itemStep === this.totalSteps - 1 ? "FINAL" : "PENDING";
      }
    });
  }

  /**
   * Updates the progress bar percentage, stage counter, and completed file count.
   */
  renderProgressBar() {
    const percent = Math.round(((this.currentStep + 1) / this.totalSteps) * 100);
    const activeStageCount = this.currentStep + 1;

    const percentBadge = document.querySelector("#sidebar-progress-percent");
    const countText = document.querySelector("#sidebar-sections-count");
    const progressFill = document.querySelector("#sidebar-progress-fill");
    const fileSections = document.querySelector("#file-sections-val");

    if (percentBadge) percentBadge.textContent = `${percent}%`;
    if (countText) {
      countText.textContent = `${activeStageCount} of ${this.totalSteps} stages active`;
    }
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (fileSections) {
      fileSections.textContent = `${this.currentStep} of ${this.totalSteps - 1} steps`;
    }
  }

  /**
   * Replaces the tip list (for example from ExternalServices / resources.json).
   * @param {Array<{ quote: string, heading: string, body: string }>} newTips
   */
  setTips(newTips) {
    if (Array.isArray(newTips) && newTips.length > 0) {
      this.tips = newTips;
      this.tipIndex = 0;
      this.renderCurrentTip();
    }
  }

  /**
   * Cycles to the next reflection/prudence tip and updates the sidebar card.
   */
  cycleTip() {
    this.tipIndex = (this.tipIndex + 1) % this.tips.length;
    this.renderCurrentTip();
  }

  /**
   * Renders the currently selected tip in the sidebar.
   */
  renderCurrentTip() {
    const tip = this.tips[this.tipIndex] || DEFAULT_TIPS[0];
    const quoteEl = document.querySelector("#reflection-quote");
    const headingEl = document.querySelector("#principle-heading");
    const bodyEl = document.querySelector("#principle-body");

    if (quoteEl) quoteEl.textContent = tip.quote;
    if (headingEl) headingEl.textContent = tip.heading;
    if (bodyEl) bodyEl.textContent = tip.body;
  }

  /**
   * Validates Step 6 commitment checkboxes and updates status badges.
   * @returns {{ valid: boolean, message: string }}
   */
  finalizePlan() {
    const accurateChecked = Boolean(document.querySelector("#s6-confirm-accurate")?.checked);
    const followupChecked = Boolean(document.querySelector("#s6-confirm-followup")?.checked);
    const statusEl = document.querySelector("#s6-final-status");
    const badgeEl = document.querySelector("#file-status-badge");

    if (!accurateChecked || !followupChecked) {
      const message = "Please check both commitment boxes above before finalizing.";
      if (statusEl) statusEl.textContent = message;
      return { valid: false, message };
    }

    this.finalized = true;
    const message = "Plan reviewed and marked ready for family & advisor follow-up ✓";
    if (statusEl) statusEl.textContent = message;
    if (badgeEl) badgeEl.textContent = "Ready";

    return { valid: true, message };
  }
}

export default WizardController;