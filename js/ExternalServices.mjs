// SelfReliancePath: Self-Reliance Plan
// External & Local Resource Service (US English, with graceful fallback)

const DEFAULT_RESOURCES_URL = "./data/resources.json";

const FALLBACK_TIPS = [
  {
    id: "fallback-1",
    quote: "“Plan carefully and work diligently toward steady improvement, building strength step by step.”",
    heading: "Principle of self-reliance",
    body: "Honest assessment of current needs, income, and resources lays a clear foundation for lasting stability."
  },
  {
    id: "fallback-2",
    quote: "“Small, consistent habits practiced every week produce lasting results over time.”",
    heading: "Practical budgeting tip",
    body: "Track every dollar spent for two weeks to spot small leaks and adjust your monthly plan with confidence."
  }
];

const FALLBACK_RESOURCES = [
  {
    step: 2,
    title: "Monthly Cash Flow Check",
    detail: "Review monthly income and expenses in USD to identify surplus or deficit early."
  }
];

/**
 * Fetches JSON with an optional timeout guard.
 * @param {string} url
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<any>}
 */
async function fetchJsonWithTimeout(url, { timeoutMs = 5000 } = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} while fetching ${url}`);
    }

    return await response.json();
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export class ExternalServices {
  /**
   * @param {{
   *   resourcesUrl?: string,
   *   quoteApiUrl?: string | null
   * }} [options]
   */
  constructor(options = {}) {
    this.resourcesUrl = options.resourcesUrl || DEFAULT_RESOURCES_URL;
    this.quoteApiUrl = options.quoteApiUrl || null;
    this.cachedCatalog = null;
  }

  /**
   * Loads local catalog from data/resources.json (cached in memory).
   * @param {{ forceRefresh?: boolean }} [options]
   * @returns {Promise<{
   *   locale: string,
   *   currency: string,
   *   reflectionTips: Array<{ id?: string, quote: string, heading: string, body: string }>,
   *   suggestedResources: Array<{ step: number, title: string, detail: string }>,
   *   source: "json" | "fallback"
   * }>}
   */
  async loadLocalCatalog({ forceRefresh = false } = {}) {
    if (this.cachedCatalog && !forceRefresh) {
      return this.cachedCatalog;
    }

    try {
      const data = await fetchJsonWithTimeout(this.resourcesUrl);
      const tips = Array.isArray(data?.reflectionTips) && data.reflectionTips.length > 0
        ? data.reflectionTips
        : FALLBACK_TIPS;
      const resources = Array.isArray(data?.suggestedResources) && data.suggestedResources.length > 0
        ? data.suggestedResources
        : FALLBACK_RESOURCES;

      this.cachedCatalog = {
        locale: data?.locale || "en-US",
        currency: data?.currency || "USD",
        reflectionTips: tips,
        suggestedResources: resources,
        source: "json"
      };
      return this.cachedCatalog;
    } catch (error) {
      console.warn("[ExternalServices] Using fallback catalog:", error);
      this.cachedCatalog = {
        locale: "en-US",
        currency: "USD",
        reflectionTips: FALLBACK_TIPS,
        suggestedResources: FALLBACK_RESOURCES,
        source: "fallback"
      };
      return this.cachedCatalog;
    }
  }

  /**
   * Returns reflection tips from local JSON or an optional external endpoint,
   * falling back safely to built-in tips if external calls fail.
   * @returns {Promise<Array<{ quote: string, heading: string, body: string }>>}
   */
  async getReflectionTips() {
    const catalog = await this.loadLocalCatalog();

    if (!this.quoteApiUrl) {
      return catalog.reflectionTips;
    }

    try {
      const externalData = await fetchJsonWithTimeout(this.quoteApiUrl);
      if (Array.isArray(externalData) && externalData.length > 0) {
        return externalData.map((item, idx) => ({
          quote: item.quote || `“${item.content || item.text || "Steady progress brings strength."}”`,
          heading: item.heading || item.author || "Self-reliance insight",
          body: item.body || catalog.reflectionTips[idx % catalog.reflectionTips.length].body
        }));
      }
      return catalog.reflectionTips;
    } catch (error) {
      console.warn("[ExternalServices] External API unavailable, using local tips:", error);
      return catalog.reflectionTips;
    }
  }

  /**
   * Returns suggested resources filtered optionally by step number.
   * @param {number} [step]
   * @returns {Promise<Array<{ step: number, title: string, detail: string }>>}
   */
  async getSuggestedResources(step) {
    const catalog = await this.loadLocalCatalog();
    if (typeof step === "number") {
      return catalog.suggestedResources.filter((item) => item.step === step);
    }
    return catalog.suggestedResources;
  }
}

export default ExternalServices;