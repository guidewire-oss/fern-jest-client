/**
 * Example test file demonstrating fern-jest-client usage
 * These tests will be reported to Fern when running with the reporter
 */

describe('Calculator [unit]', () => {
  function add(a: number, b: number): number {
    return a + b;
  }

  function subtract(a: number, b: number): number {
    return a - b;
  }

  function divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    return a / b;
  }

  describe('Addition operations @math', () => {
    it('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('should add negative numbers', () => {
      expect(add(-1, -2)).toBe(-3);
    });

    it('should add zero correctly #edge-case', () => {
      expect(add(5, 0)).toBe(5);
      expect(add(0, 5)).toBe(5);
    });
  });

  describe('Subtraction operations @math', () => {
    it('should subtract two positive numbers', () => {
      expect(subtract(5, 3)).toBe(2);
    });

    it('should handle negative results', () => {
      expect(subtract(3, 5)).toBe(-2);
    });
  });

  describe('Division operations @math #edge-case', () => {
    it('should divide two positive numbers', () => {
      expect(divide(10, 2)).toBe(5);
    });

    it('should throw error for division by zero', () => {
      expect(() => divide(10, 0)).toThrow('Division by zero');
    });

    it.skip('should handle floating point division', () => {
      // This test is skipped to demonstrate skipped test reporting
      expect(divide(1, 3)).toBeCloseTo(0.333, 3);
    });
  });
});

describe('String utilities [integration]', () => {
  function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  function reverseString(str: string): string {
    return str.split('').reverse().join('');
  }

  describe('String manipulation @string-utils', () => {
    it('should capitalize strings correctly', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('World');
      expect(capitalize('javaScript')).toBe('Javascript');
    });

    it('should reverse strings correctly', () => {
      expect(reverseString('hello')).toBe('olleh');
      expect(reverseString('123')).toBe('321');
    });

    it('should handle empty strings', () => {
      expect(capitalize('')).toBe('');
      expect(reverseString('')).toBe('');
    });
  });

  describe('Edge cases #edge-case', () => {
    it('should handle single character strings', () => {
      expect(capitalize('a')).toBe('A');
      expect(reverseString('x')).toBe('x');
    });

    it('should handle special characters', () => {
      expect(reverseString('!@#')).toBe('#@!');
    });
  });
});

describe('Async operations [integration] @async', () => {
  async function fetchData(delay: number = 100): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => resolve('data'), delay);
    });
  }

  async function fetchWithError(): Promise<string> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Network error')), 50);
    });
  }

  it('should handle successful async operations', async () => {
    const result = await fetchData();
    expect(result).toBe('data');
  });

  it('should handle async operations with custom delay', async () => {
    const start = Date.now();
    const result = await fetchData(200);
    const elapsed = Date.now() - start;
    
    expect(result).toBe('data');
    expect(elapsed).toBeGreaterThan(190);
  });

  it('should handle async errors correctly', async () => {
    await expect(fetchWithError()).rejects.toThrow('Network error');
  });

  it.todo('should implement timeout handling');
});