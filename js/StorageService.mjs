// SelfReliancePath: Self-Reliance Plan
// Persistence & Autosave Service (US English, localStorage with in-memory fallback)

const DEFAULT_STORAGE_KEY = "selfReliancePath_planData_v1";

/**
 * Checks whether browser localStorage is accessible and writable.
 * @returns {boolean}
 */
function isLocalStorageAvailable() {
  try {
    const testKey = "__srp_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export class StorageService {
  /**
   * @param {string} [storageKey]
   */
  constructor(storageKey = DEFAULT_STORAGE_KEY) {
    this.storageKey = storageKey;
    this.useLocalStorage = isLocalStorageAvailable();
    this.memoryFallback = null;
  }

  /**
   * Saves the complete plan state object and attaches a timestamp.
   * @param {Record<string, unknown>} planData
   * @returns {{ success: boolean, savedAt: string, mode: "localStorage" | "memory" }}
   */
  savePlan(planData) {
    const payload = {
      ...planData,
      updatedAt: new Date().toISOString()
    };

    try {
      const serialized = JSON.stringify(payload);
      if (this.useLocalStorage) {
        window.localStorage.setItem(this.storageKey, serialized);
        return { success: true, savedAt: payload.updatedAt, mode: "localStorage" };
      }
      this.memoryFallback = serialized;
      return { success: true, savedAt: payload.updatedAt, mode: "memory" };
    } catch (error) {
      console.error("[StorageService] Failed to save plan:", error);
      return { success: false, savedAt: payload.updatedAt, mode: "memory" };
    }
  }

  /**
   * Loads the saved plan state or returns null if none exists.
   * @returns {Record<string, unknown> | null}
   */
  loadPlan() {
    try {
      const raw = this.useLocalStorage
        ? window.localStorage.getItem(this.storageKey)
        : this.memoryFallback;

      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      console.error("[StorageService] Failed to parse saved plan:", error);
      return null;
    }
  }

  /**
   * Removes saved plan data so the user can start fresh.
   * @returns {boolean}
   */
  clearPlan() {
    try {
      if (this.useLocalStorage) {
        window.localStorage.removeItem(this.storageKey);
      }
      this.memoryFallback = null;
      return true;
    } catch (error) {
      console.error("[StorageService] Failed to clear plan:", error);
      return false;
    }
  }

  /**
   * Formats an ISO timestamp into a concise US English status string.
   * @param {string} [isoTimestamp]
   * @returns {string}
   */
  formatSavedStatus(isoTimestamp) {
    if (!isoTimestamp) return "Your work is saved automatically ✓";
    const date = new Date(isoTimestamp);
    if (Number.isNaN(date.getTime())) return "Your work is saved automatically ✓";

    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });
    return `Saved automatically at ${timeStr} ✓`;
  }
}

export default StorageService;