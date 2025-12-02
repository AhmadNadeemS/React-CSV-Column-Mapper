import React, { useRef, useState } from 'react';

interface UploadStepProps {
  onFileSelected: (file: File) => void;
}

export const UploadStep: React.FC<UploadStepProps> = ({ onFileSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

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

  return (
    <div>
      <p>
        You can use the attached sample CSV file to get started: <a href="#" id="csv-download-sample">example.csv</a>
      </p>
      <div
        className={`csv-upload-area ${isDragOver ? 'dragover' : ''}`}
        id="csv-drop-zone"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
        />
      </div>
      <a href="#" className="csv-paste-link" id="csv-paste-trigger">
        Or click here to copy paste table data
      </a>
    </div>
  );
};
