// test/schema/pathParamsSchema.test.ts
import { describe, expect, it } from 'vitest';
import { validateEmailParam, validateBoardIdParam } from '../../src/schema/pathParamsSchema';

describe('pathParamsSchema', () => {
  describe('validateEmailParam', () => {
    it('should validate correct email', () => {
      const email = 'test@example.com';
      const result = validateEmailParam(email);
      
      expect(result).toBe(email);
    });

    it('should validate email with special characters', () => {
      const email = 'user.name+tag@example.com';
      const result = validateEmailParam(email);
      
      expect(result).toBe(email);
    });

    it('should throw error for invalid email format', () => {
      const invalidEmails = [
        'invalid-email',
        'no-at-sign.com',
        '@example.com',
        'user@',
        'user..name@example.com',
      ];

      invalidEmails.forEach(email => {
        expect(() => validateEmailParam(email)).toThrow('Invalid email format');
      });
    });
  });

  describe('validateBoardIdParam', () => {
    it('should validate non-empty board ID', () => {
      const boardId = 'board-123';
      const result = validateBoardIdParam(boardId);
      
      expect(result).toBe(boardId);
    });

    it('should validate UUID board ID', () => {
      const boardId = '123e4567-e89b-12d3-a456-426614174000';
      const result = validateBoardIdParam(boardId);
      
      expect(result).toBe(boardId);
    });

    it('should validate alphanumeric board ID', () => {
      const boardId = 'board_123_abc';
      const result = validateBoardIdParam(boardId);
      
      expect(result).toBe(boardId);
    });

    it('should throw error for empty board ID', () => {
      expect(() => validateBoardIdParam('')).toThrow('Invalid board ID format');
    });

    it('should throw error for whitespace-only board ID', () => {
      expect(() => validateBoardIdParam('   ')).toThrow('Invalid board ID format');
    });
  });
});