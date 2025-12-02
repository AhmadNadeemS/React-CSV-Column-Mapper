import React, { useState } from 'react';
import { CsvColumn } from '../types';
import { ValidationResult } from '../utils/Validator';

interface ValidationStepProps {
  validationResults: ValidationResult[];
  templateFields: CsvColumn[];
  onCellEdited: (rowIndex: number, fieldKey: string, newValue: string) => void;
  onRemoveRow: (index: number) => void;
  onExportJson: () => void;
  onExportCsv: () => void;
}

export const ValidationStep: React.FC<ValidationStepProps> = ({
  validationResults,
  templateFields,
  onCellEdited,
  onRemoveRow,
  onExportJson,
  onExportCsv,
}) => {
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; fieldKey: string } | null>(
    null
  );

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    rowIndex: number,
    fieldKey: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>, rowIndex: number, fieldKey: string) => {
    const newValue = e.currentTarget.textContent?.trim() || '';
    onCellEdited(rowIndex, fieldKey, newValue);
    setEditingCell(null);
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <button className="csv-btn csv-btn-secondary" id="csv-export-json" onClick={onExportJson}>
          Export JSON
        </button>
        <button className="csv-btn csv-btn-secondary" id="csv-export-csv" onClick={onExportCsv} style={{ marginLeft: '8px' }}>
          Export CSV
        </button>
      </div>
      <div className="csv-preview-table-container">
        <table className="csv-table csv-validation-table">
          <thead>
            <tr>
              <th>#</th>
              {templateFields.map((f) => (
                <th key={f.key}>{f.label}</th>
              ))}
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            {validationResults.map((row, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                {templateFields.map((f) => {
                  const value = row.transformed[f.key] || '';
                  const error = row.errors[f.key];
                  return (
                    <td
                      key={f.key}
                      className={error ? 'error' : ''}
                      data-row-index={i}
                      data-field-key={f.key}
                    >
                      <div
                        className="csv-cell-content"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleBlur(e, i, f.key)}
                        onKeyDown={(e) => handleKeyDown(e, i, f.key)}
                      >
                        {value}
                      </div>
                      {error && <div className="csv-error-tooltip">{error}</div>}
                    </td>
                  );
                })}
                <td
                  className="csv-remove-row"
                  data-index={i}
                  onClick={() => onRemoveRow(i)}
                >
                  X
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
