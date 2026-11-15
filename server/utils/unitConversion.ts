// unitConversion.ts – helpers for normalising entered quantities
/**
 * Normalise a quantity expressed in a given unit to the product's baseStockUnit.
 * For now we handle only simple conversions where packSize is defined.
 * Example: enteredQuantity = 4, enteredUnit = 'bag', product.packSize = 25, product.baseStockUnit = 'kg'
 * => returns 4 * 25 = 100 (kg)
 */
export function normaliseQuantity(enteredQuantity: number, enteredUnit: string, packSize?: number): number {
  // If the entered unit matches the base unit, no conversion.
  if (!packSize || enteredUnit === 'kg' || enteredUnit === 'g' || enteredUnit === 'l' || enteredUnit === 'ml') {
    return enteredQuantity;
  }
  // Assume enteredUnit represents a pack of size `packSize` of the base unit.
  return enteredQuantity * (packSize ?? 1);
}
