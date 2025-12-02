import { CsvColumn } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  transformed: Record<string, string>;
}

export class Validator {
  private templateFields: CsvColumn[];

  constructor(templateFields: CsvColumn[]) {
    this.templateFields = templateFields;
  }

  /**
   * Auto-map CSV headers to template fields using fuzzy matching
   */
  autoMap(headers: string[]): Record<string, number> {
    const mapping: Record<string, number> = {};
    const usedIndices = new Set<number>();

    this.templateFields.forEach(field => {
      const fieldLabel = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');

      // 1. Exact match
      let bestMatchIndex = -1;
      let bestMatchScore = 0;

      headers.forEach((header, index) => {
        if (usedIndices.has(index)) return;

        const headerLabel = header.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (headerLabel === fieldLabel) {
          bestMatchIndex = index;
          bestMatchScore = 1.0;
        } else if (headerLabel.includes(fieldLabel) || fieldLabel.includes(headerLabel)) {
          // Partial match
          if (bestMatchScore < 0.8) {
            bestMatchIndex = index;
            bestMatchScore = 0.8;
          }
        }
      });

      if (bestMatchIndex !== -1) {
        mapping[field.key] = bestMatchIndex;
        usedIndices.add(bestMatchIndex);
      }
    });

    return mapping;
  }

  /**
   * Validate a single row of data
   */
  validateRow(row: string[], mapping: Record<string, number>): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: {},
      transformed: {}
    };

    this.templateFields.forEach(field => {
      const columnIndex = mapping[field.key];
      let value = columnIndex !== undefined && columnIndex !== -1 ? row[columnIndex] : '';

      // Trim whitespace
      if (typeof value === 'string') {
        value = value.trim();
      }

      // Check required
      if (field.required && (value === '' || value === null || value === undefined)) {
        result.isValid = false;
        result.errors[field.key] = 'Required field';
      }

      // Custom validation
      if (field.validate && value) {
        const validationResult = field.validate(value);
        if (validationResult !== true) {
          result.isValid = false;
          result.errors[field.key] = typeof validationResult === 'string' ? validationResult : 'Invalid value';
        }
      }

      result.transformed[field.key] = value;
    });

    return result;
  }

  /**
   * Validate all data with cross-row validation (duplicates)
   */
  validateAll(data: string[][], mapping: Record<string, number>): ValidationResult[] {
    const results = data.map(row => this.validateRow(row, mapping));

    // Check for duplicate emails
    const emailField = this.templateFields.find(f => f.key === 'email' || f.label.toLowerCase().includes('email'));
    if (emailField) {
      const emailMap = new Map<string, number>();
      results.forEach((result, index) => {
        const email = result.transformed[emailField.key];
        if (email && email.trim() !== '') {
          const normalizedEmail = email.toLowerCase().trim();
          if (emailMap.has(normalizedEmail)) {
            result.isValid = false;
            result.errors[emailField.key] = 'Duplicate email';
            // Also mark the first occurrence
            const firstIndex = emailMap.get(normalizedEmail)!;
            results[firstIndex].isValid = false;
            results[firstIndex].errors[emailField.key] = 'Duplicate email';
          } else {
            emailMap.set(normalizedEmail, index);
          }
        }
      });
    }

    return results;
  }

  /**
   * Re-validate already transformed data (for use after editing)
   */
  revalidateTransformed(transformedResults: ValidationResult[]): ValidationResult[] {
    // Re-validate each row based on its transformed data
    const results = transformedResults.map(existingResult => {
      const result: ValidationResult = {
        isValid: true,
        errors: {},
        transformed: { ...existingResult.transformed } // Preserve all existing values
      };

      // Validate each field
      this.templateFields.forEach(field => {
        const value = result.transformed[field.key] || '';

        // Check required
        if (field.required && (value === '' || value === null || value === undefined)) {
          result.isValid = false;
          result.errors[field.key] = 'Required field';
        }

        // Custom validation
        if (field.validate && value) {
          const validationResult = field.validate(value);
          if (validationResult !== true) {
            result.isValid = false;
            result.errors[field.key] = typeof validationResult === 'string' ? validationResult : 'Invalid value';
          }
        }
      });

      return result;
    });

    // Check for duplicate emails
    const emailField = this.templateFields.find(f => f.key === 'email' || f.label.toLowerCase().includes('email'));
    if (emailField) {
      const emailMap = new Map<string, number>();
      results.forEach((result, index) => {
        const email = result.transformed[emailField.key];
        if (email && email.trim() !== '') {
          const normalizedEmail = email.toLowerCase().trim();
          if (emailMap.has(normalizedEmail)) {
            result.isValid = false;
            result.errors[emailField.key] = 'Duplicate email';
            // Also mark the first occurrence
            const firstIndex = emailMap.get(normalizedEmail)!;
            results[firstIndex].isValid = false;
            results[firstIndex].errors[emailField.key] = 'Duplicate email';
          } else {
            emailMap.set(normalizedEmail, index);
          }
        }
      });
    }

    return results;
  }
}
