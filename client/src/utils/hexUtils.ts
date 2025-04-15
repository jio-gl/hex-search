/**
 * Normalizes a hexadecimal string to lowercase with 0x prefix
 */
export const normalizeHex = (hex: string): string => {
  if (!hex) return '';
  
  // Remove 0x prefix if exists, then add it back
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  return `0x${cleanHex.toLowerCase()}`;
};

/**
 * Validates if a string is a valid hexadecimal
 */
export const isValidHex = (hex: string): boolean => {
  return /^(0x)?[0-9a-fA-F]+$/.test(hex);
};

/**
 * Shortens a hex string for display
 */
export const shortenHex = (hex: string, chars = 4): string => {
  if (!hex) return '';
  const normalizedHex = normalizeHex(hex);
  
  return `${normalizedHex.substring(0, chars + 2)}...${normalizedHex.substring(normalizedHex.length - chars)}`;
};
