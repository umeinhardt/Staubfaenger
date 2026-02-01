import { GravityFormula } from './GravityFormula';

/**
 * Registry for managing different gravity formula implementations
 * Allows for extensible gravity calculations
 */
export class GravityRegistry {
  private formulas: Map<string, GravityFormula>;

  constructor() {
    this.formulas = new Map();
  }

  /**
   * Register a new gravity formula
   * @param formula - The gravity formula to register
   * @throws Error if a formula with the same name already exists
   */
  register(formula: GravityFormula): void {
    if (this.formulas.has(formula.name)) {
      throw new Error(`Gravity formula with name "${formula.name}" is already registered`);
    }
    this.formulas.set(formula.name, formula);
  }

  /**
   * Get a gravity formula by name
   * @param name - Name of the gravity formula
   * @returns The gravity formula
   * @throws Error if the formula is not found
   */
  get(name: string): GravityFormula {
    const formula = this.formulas.get(name);
    if (!formula) {
      throw new Error(`Gravity formula with name "${name}" not found`);
    }
    return formula;
  }

  /**
   * List all registered gravity formula names
   * @returns Array of formula names
   */
  list(): string[] {
    return Array.from(this.formulas.keys());
  }

  /**
   * Check if a formula is registered
   * @param name - Name of the gravity formula
   * @returns True if the formula is registered
   */
  has(name: string): boolean {
    return this.formulas.has(name);
  }

  /**
   * Unregister a gravity formula
   * @param name - Name of the gravity formula to remove
   * @returns True if the formula was removed, false if it didn't exist
   */
  unregister(name: string): boolean {
    return this.formulas.delete(name);
  }

  /**
   * Clear all registered formulas
   */
  clear(): void {
    this.formulas.clear();
  }

  /**
   * Get the number of registered formulas
   * @returns Number of registered formulas
   */
  count(): number {
    return this.formulas.size;
  }
}
