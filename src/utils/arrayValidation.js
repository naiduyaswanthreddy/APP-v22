/**
 * Utility functions for array validation and safe array operations
 */

/**
 * Safely checks if a value is an array and returns it, or returns empty array
 * @param {*} value - The value to check
 * @returns {Array} - Safe array (empty array if not valid)
 */
export const safeArray = (value) => {
  return Array.isArray(value) ? value : [];
};

/**
 * Safely maps over an array with fallback handling
 * @param {*} array - The array to map over
 * @param {Function} callback - The mapping function
 * @param {*} fallback - Fallback value if not an array
 * @returns {Array} - Mapped array or fallback
 */
export const safeMap = (array, callback, fallback = []) => {
  return Array.isArray(array) ? array.map(callback) : fallback;
};

/**
 * Checks if a value is a valid array with items
 * @param {*} value - The value to check
 * @returns {boolean} - True if valid non-empty array
 */
export const isValidArray = (value) => {
  return Array.isArray(value) && value.length > 0;
};
