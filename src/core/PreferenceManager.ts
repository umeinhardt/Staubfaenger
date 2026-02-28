/**
 * Performance preferences for GPU acceleration and rendering
 */
export interface PerformancePreferences {
  preferGPU: boolean;
  gpuThreshold: number;
  useInstancedRendering: boolean;
  lastUpdated: Date;
}

/**
 * Manager for persisting performance preferences to browser storage
 * Validates: Requirement 7.6
 */
export class PreferenceManager {
  private storageKey = 'simulation-performance-preferences';

  /**
   * Save preferences to localStorage
   * @param prefs - Preferences to save
   */
  savePreferences(prefs: PerformancePreferences): void {
    try {
      const data = {
        ...prefs,
        lastUpdated: prefs.lastUpdated.toISOString()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, preferences not saved');
      } else {
        console.error('Failed to save preferences:', error);
      }
    }
  }

  /**
   * Load preferences from localStorage
   * @returns Preferences or null if not found
   */
  loadPreferences(): PerformancePreferences | null {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data);
      return {
        preferGPU: parsed.preferGPU,
        gpuThreshold: parsed.gpuThreshold,
        useInstancedRendering: parsed.useInstancedRendering,
        lastUpdated: new Date(parsed.lastUpdated)
      };
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return null;
    }
  }

  /**
   * Clear preferences from localStorage
   */
  clearPreferences(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear preferences:', error);
    }
  }
}
