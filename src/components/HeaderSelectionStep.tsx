import React from 'react';

interface HeaderSelectionStepProps {
  data: string[][];
  selectedRowIndex: number;
  onRowSelected: (index: number) => void;
}

export const HeaderSelectionStep: React.FC<HeaderSelectionStepProps> = ({
  data,
  selectedRowIndex,
  onRowSelected,
}) => {
  // Show only first 10 rows for preview
  const previewRows = data.slice(0, 10);

  return (
    <div>
      <div className="csv-preview-table-container">
        <table className="csv-table">
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i} className={i === selectedRowIndex ? 'csv-header-row' : ''}>
                <td className="csv-row-select">
                  <input
                    type="radio"
                    name="header-row"
                    value={i}
                    checked={i === selectedRowIndex}
                    onChange={() => onRowSelected(i)}
                  />
                </td>
                <td className="csv-row-index">{i + 1}</td>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
