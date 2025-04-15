/**
 * Normalize a hex string by removing '0x' prefix and converting to lowercase
 * @param hex The hex string to normalize
 * @returns The normalized hex string
 */
export function normalizeHex(hex: string): string {
  if (!hex) return '';
  
  // Remove '0x' prefix if present
  const withoutPrefix = hex.startsWith('0x') ? hex.substring(2) : hex;
  
  // Convert to lowercase
  return withoutPrefix.toLowerCase();
}

/**
 * Check if a string is a valid hex string
 * @param hex The string to check
 * @returns True if the string is a valid hex string
 */
export function isValidHex(hex: string): boolean {
  if (!hex) return false;
  
  // Remove '0x' prefix if present
  const withoutPrefix = hex.startsWith('0x') ? hex.substring(2) : hex;
  
  // Check if the string contains only valid hex characters
  return /^[0-9a-fA-F]+$/.test(withoutPrefix);
}

/**
 * Add '0x' prefix to a hex string if it doesn't already have it
 * @param hex The hex string to add prefix to
 * @returns The hex string with '0x' prefix
 */
export function addHexPrefix(hex: string): string {
  if (!hex) return '';
  
  return hex.startsWith('0x') ? hex : `0x${hex}`;
} 