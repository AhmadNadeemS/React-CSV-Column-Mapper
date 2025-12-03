import React, { useRef, useState } from 'react';

interface UploadStepProps {
  onFileSelected: (file: File) => void;
  onDataPasted?: (data: string, delimiter?: string) => void;
  isLoading?: boolean;
  progress?: { percent: number; rowsParsed: number };
}

export const UploadStep: React.FC<UploadStepProps> = ({ onFileSelected, onDataPasted, isLoading = false, progress }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [viewMode, setViewMode] = useState<'upload' | 'paste'>('upload');
  const [pasteData, setPasteData] = useState('');
  const [delimiter, setDelimiter] = useState(',');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };

  const handlePasteSubmit = () => {
    if (pasteData.trim() && onDataPasted) {
      onDataPasted(pasteData, delimiter);
      setPasteData('');
      setViewMode('upload');
    }
  };

  if (viewMode === 'paste') {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
          Copy existing table data from a spreadsheet (like an Excel workbook or Google Sheet) and paste it in the field below.
        </p>
        <textarea
          className="csv-paste-textarea"
          placeholder=""
          value={pasteData}
          onChange={(e) => setPasteData(e.target.value)}
          autoFocus
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: '#666' }}>Select Delimiter</label>
            <select
              className="csv-delimiter-select"
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value)}
            >
              <option value=",">Comma</option>
              <option value="\t">Tab</option>
              <option value=";">Semicolon</option>
              <option value="|">Pipe</option>
              <option value=" ">Space</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="csv-btn csv-btn-secondary"
              onClick={() => {
                setViewMode('upload');
                setPasteData('');
              }}
            >
              Cancel
            </button>
            <button
              className="csv-btn csv-btn-primary"
              onClick={handlePasteSubmit}
              disabled={!pasteData.trim() || isLoading}
            >
              Import Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '700px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '300px'
    }}>
      <div
        className={`csv-upload-area ${isDragOver ? 'dragover' : ''}`}
        id="csv-drop-zone"
        onClick={() => !isLoading && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          opacity: isLoading ? 0.6 : 1,
          pointerEvents: isLoading ? 'none' : 'auto',
          width: '100%',
          position: 'relative'
        }}
      >
        <div className="csv-upload-text">Drop files here or click to upload</div>
        <div className="csv-upload-subtext">XLS, XLSX, CSV files are accepted</div>
        <input
          type="file"
          id="csv-file-input"
          accept=".csv,.xls,.xlsx"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={isLoading}
        />

        {isLoading && (
          <div className="csv-loading-overlay">
            <div className="csv-loading-spinner"></div>
            <div className="csv-loading-text">Processing your file...</div>
            {progress && progress.percent > 0 && (
              <>
                <div className="csv-progress-bar" style={{ marginTop: '16px', width: '80%', maxWidth: '300px' }}>
                  <div
                    className="csv-progress-fill csv-progress-fill-bar"
                    style={{
                      width: `${progress.percent}%`,
                      height: '8px'
                    }}
                  ></div>
                </div>
                <div className="csv-loading-subtext" style={{ marginTop: '8px' }}>
                  {progress.percent}% • {progress.rowsParsed.toLocaleString()} rows
                </div>
              </>
            )}
            {(!progress || progress.percent === 0) && (
              <div className="csv-loading-subtext">This may take a moment for large files</div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <a
          href="#"
          className="csv-paste-data-link"
          style={{textDecoration: 'none'}}
          onClick={(e) => {
            e.preventDefault();
            if (!isLoading) setViewMode('paste');
          }}
        >
          Or click here to copy paste table data
        </a>
      </div>
    </div>
  );
};
