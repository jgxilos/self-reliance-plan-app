// SelfReliancePath: Self-Reliance Plan
// External APIs & Local Resource Service (US English, with graceful fallback)

const DEFAULT_RESOURCES_URL = "./data/resources.json";

const API_ENDPOINTS = {
  bibleBase: "https://bible-api.com",
  adviceSlip: "https://api.adviceslip.com/advice",
  quotesRandom: "https://dummyjson.com/quotes/random"
};

const STEWARDSHIP_PASSAGES = [
  "proverbs+6:6-8",
  "proverbs+21:5",
  "matthew+25:21",
  "2+timothy+1:7"
];

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

function cleanText(text = "") {
  return String(text).replace(/\s+/g, " ").trim();
}

/**
 * Fetches JSON with an AbortController timeout guard.
 * @param {string} url
 * @param {{ timeoutMs?: number, cacheMode?: RequestCache }} [options]
 * @returns {Promise<any>}
 */
async function fetchJsonWithTimeout(url, { timeoutMs = 4500, cacheMode = "default" } = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: cacheMode,
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
   *   bibleBaseUrl?: string,
   *   adviceApiUrl?: string,
   *   quotesApiUrl?: string,
   *   timeoutMs?: number
   * }} [options]
   */
  constructor(options = {}) {
    this.resourcesUrl = options.resourcesUrl || DEFAULT_RESOURCES_URL;
    this.bibleBaseUrl = options.bibleBaseUrl || API_ENDPOINTS.bibleBase;
    this.adviceApiUrl = options.adviceApiUrl || API_ENDPOINTS.adviceSlip;
    this.quotesApiUrl = options.quotesApiUrl || API_ENDPOINTS.quotesRandom;
    this.timeoutMs = options.timeoutMs ?? 4500;
    this.cachedCatalog = null;
    this.cachedTips = null;
    this.passageCursor = 0;
  }

  /**
   * Loads local catalog from data/resources.json (cached in memory).
   */
  async loadLocalCatalog({ forceRefresh = false } = {}) {
    if (this.cachedCatalog && !forceRefresh) {
      return this.cachedCatalog;
    }

    try {
      const data = await fetchJsonWithTimeout(this.resourcesUrl, { timeoutMs: this.timeoutMs });
      const tips =
        Array.isArray(data?.reflectionTips) && data.reflectionTips.length > 0
          ? data.reflectionTips
          : FALLBACK_TIPS;
      const resources =
        Array.isArray(data?.suggestedResources) && data.suggestedResources.length > 0
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
    } catch {
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
   * 1) Bible API (https://bible-api.com/)
   * Extracts: reference, text, translation_name, verses
   */
  async fetchScripture(passage) {
    const selectedPassage =
      passage || STEWARDSHIP_PASSAGES[this.passageCursor % STEWARDSHIP_PASSAGES.length];
    this.passageCursor += 1;

    const url = `${this.bibleBaseUrl}/${encodeURIComponent(selectedPassage).replace(/%2B/g, "+")}`;
    const data = await fetchJsonWithTimeout(url, { timeoutMs: this.timeoutMs });

    const verses = Array.isArray(data?.verses) ? data.verses : [];
    const reference = cleanText(data?.reference || selectedPassage.replace(/\+/g, " "));
    const translationName = cleanText(data?.translation_name || "Bible API");
    const verseText = cleanText(
      data?.text || verses.map((v) => v?.text || "").join(" ")
    );

    if (!verseText) {
      throw new Error("Empty scripture text returned by Bible API");
    }

    return {
      source: "bible-api",
      reference,
      text: verseText,
      translation_name: translationName,
      verses,
      tip: {
        id: `bible-${reference.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        quote: `“${verseText}” — ${reference}`,
        heading: `Scriptural reflection (${translationName})`,
        body: "Apply diligence, wise stewardship, and faith as you review your household priorities."
      }
    };
  }

  /**
   * 2) Advice Slip API (https://api.adviceslip.com/advice)
   * Extracts: slip.id, slip.advice
   */
  async fetchAdvice() {
    const data = await fetchJsonWithTimeout(this.adviceApiUrl, {
      timeoutMs: this.timeoutMs,
      cacheMode: "no-store"
    });

    const slipId = data?.slip?.id ?? null;
    const adviceText = cleanText(data?.slip?.advice || "");

    if (!adviceText) {
      throw new Error("Empty advice returned by Advice Slip API");
    }

    return {
      source: "advice-slip",
      slip: {
        id: slipId,
        advice: adviceText
      },
      tip: {
        id: `advice-${slipId ?? Date.now()}`,
        quote: `“${adviceText}”`,
        heading: slipId ? `Practical prudence tip (#${slipId})` : "Practical prudence tip",
        body: "Turn practical counsel into one small, measurable step in your weekly household routine."
      }
    };
  }

  /**
   * 3) Quotes API (https://dummyjson.com/quotes/random)
   * Extracts: id, quote, author
   */
  async fetchQuote() {
    const data = await fetchJsonWithTimeout(this.quotesApiUrl, {
      timeoutMs: this.timeoutMs,
      cacheMode: "no-store"
    });

    const id = data?.id ?? null;
    const content = cleanText(data?.quote || "");
    const author = cleanText(data?.author || "Unknown");

    if (!content) {
      throw new Error("Empty quote returned by Quotes API");
    }

    return {
      source: "quotes-api",
      id,
      content,
      author,
      tip: {
        id: `quote-${id ?? Date.now()}`,
        quote: `“${content}” — ${author}`,
        heading: "Perseverance & wisdom",
        body: "Steady persistence builds long-term family strength even when progress feels gradual."
      }
    };
  }

  /**
   * Fetches tips from external APIs and local resources.json, caching the resulting list
   * unless forceRefresh is true.
   * @param {{ forceRefresh?: boolean }} [options]
   */
  async getReflectionTips({ forceRefresh = false } = {}) {
    if (this.cachedTips && !forceRefresh) {
      return this.cachedTips;
    }

    const catalog = await this.loadLocalCatalog({ forceRefresh });
    const localTips = catalog.reflectionTips || FALLBACK_TIPS;

    const results = await Promise.allSettled([
      this.fetchScripture(),
      this.fetchAdvice(),
      this.fetchQuote()
    ]);

    const liveTips = results
      .filter((res) => res.status === "fulfilled" && res.value?.tip)
      .map((res) => res.value.tip);

    this.cachedTips = [...liveTips, ...localTips];
    return this.cachedTips;
  }

  /**
   * Returns suggested resources filtered optionally by step number.
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