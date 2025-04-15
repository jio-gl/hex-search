/**
 * Validates if a string is a valid hexadecimal value
 * @param value The string to validate
 * @returns boolean indicating if the string is a valid hex value
 */
export const isValidHex = (value: string): boolean => {
  return /^(0x)?[0-9a-fA-F]+$/.test(value);
};

/**
 * Normalizes a hexadecimal string by removing the 0x prefix and converting to lowercase
 * @param value The hex string to normalize
 * @returns The normalized hex string
 */
export const normalizeHex = (value: string): string => {
  return value.toLowerCase().replace(/^0x/, '');
};

/**
 * Adds the 0x prefix to a hex string if it doesn't already have it
 * @param value The hex string to format
 * @returns The hex string with 0x prefix
 */
export const addHexPrefix = (value: string): string => {
  return value.startsWith('0x') ? value : `0x${value}`;
};

/**
 * Converts a hex string to a Buffer
 * @param value The hex string to convert
 * @returns Buffer containing the hex data
 */
export const hexToBuffer = (value: string): Buffer => {
  const normalized = normalizeHex(value);
  return Buffer.from(normalized, 'hex');
};

/**
 * Converts a Buffer to a hex string
 * @param buffer The buffer to convert
 * @returns The hex string representation
 */
export const bufferToHex = (buffer: Buffer): string => {
  return buffer.toString('hex');
}; 