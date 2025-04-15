import { normalizeHex, isValidHex, shortenHex } from '../utils/hexUtils';

describe('Hex Utility Functions', () => {
  describe('normalizeHex', () => {
    test('converts uppercase to lowercase', () => {
      expect(normalizeHex('0xABCDEF')).toBe('0xabcdef');
    });

    test('adds 0x prefix if missing', () => {
      expect(normalizeHex('123abc')).toBe('0x123abc');
    });

    test('handles empty string', () => {
      expect(normalizeHex('')).toBe('');
    });
  });

  describe('isValidHex', () => {
    test('validates correct hex strings', () => {
      expect(isValidHex('0x123abc')).toBe(true);
      expect(isValidHex('123ABC')).toBe(true);
      expect(isValidHex('0x0')).toBe(true);
    });

    test('invalidates incorrect hex strings', () => {
      expect(isValidHex('0xGHIJK')).toBe(false);
      expect(isValidHex('not-hex')).toBe(false);
      expect(isValidHex('0x!@#')).toBe(false);
    });
  });

  describe('shortenHex', () => {
    test('shortens hex strings', () => {
      expect(shortenHex('0x1234567890abcdef1234567890abcdef12345678')).toBe('0x1234...5678');
    });

    test('uses custom character length', () => {
      expect(shortenHex('0x1234567890abcdef1234567890abcdef12345678', 6)).toBe('0x123456...345678');
    });

    test('handles empty string', () => {
      expect(shortenHex('')).toBe('');
    });
  });
});
