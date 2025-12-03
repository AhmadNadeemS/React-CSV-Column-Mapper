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
  const [currentPage, setCurrentPage] = React.useState(1);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(data.length / rowsPerPage);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentRows = data.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return (
    <div>
      <div className="csv-preview-table-container">
        <table className="csv-table">
          <tbody>
            {currentRows.map((row, i) => {
              const absoluteIndex = startIndex + i;
              return (
                <tr key={absoluteIndex} className={absoluteIndex === selectedRowIndex ? 'csv-header-row' : ''}>
                  <td className="csv-row-select">
                    <input
                      type="radio"
                      name="header-row"
                      value={absoluteIndex}
                      checked={absoluteIndex === selectedRowIndex}
                      onChange={() => onRowSelected(absoluteIndex)}
                    />
                  </td>
                  <td className="csv-row-index">{absoluteIndex + 1}</td>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="csv-pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
          <button
            className="csv-btn csv-btn-secondary"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            style={{ padding: '4px 12px', fontSize: '14px' }}
          >
            Previous
          </button>
          <span style={{ fontSize: '14px', color: '#666' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="csv-btn csv-btn-secondary"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            style={{ padding: '4px 12px', fontSize: '14px' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
