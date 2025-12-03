// CSV Parser Web Worker
// Handles large file parsing in a separate thread to prevent UI blocking

export interface ParseMessage {
  type: 'parse';
  text: string;
  delimiter: string;
  quoteChar: string;
  chunkIndex: number;
  totalChunks: number;
}

export interface CancelMessage {
  type: 'cancel';
}

export interface ProgressMessage {
  type: 'progress';
  percent: number;
  rowsParsed: number;
  chunkIndex: number;
}

export interface ResultMessage {
  type: 'result';
  rows: string[][];
  chunkIndex: number;
  isComplete: boolean;
}

export interface ErrorMessage {
  type: 'error';
  error: string;
}

type WorkerMessage = ParseMessage | CancelMessage;
type WorkerResponse = ProgressMessage | ResultMessage | ErrorMessage;

let cancelled = false;

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const message = e.data;

  if (message.type === 'cancel') {
    cancelled = true;
    return;
  }

  if (message.type === 'parse') {
    cancelled = false;
    try {
      const rows = parseCSVChunk(
        message.text,
        message.delimiter,
        message.quoteChar,
        message.chunkIndex,
        message.totalChunks
      );

      if (!cancelled) {
        const response: ResultMessage = {
          type: 'result',
          rows,
          chunkIndex: message.chunkIndex,
          isComplete: message.chunkIndex === message.totalChunks - 1
        };
        self.postMessage(response);
      }
    } catch (error) {
      if (!cancelled) {
        const response: ErrorMessage = {
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        self.postMessage(response);
      }
    }
  }
};

function parseCSVChunk(
  text: string,
  delimiter: string,
  quoteChar: string,
  chunkIndex: number,
  totalChunks: number
): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuote = false;

  // Normalize line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    // Check for cancellation every 1000 characters
    if (i % 1000 === 0 && cancelled) {
      throw new Error('Parsing cancelled');
    }

    const char = text[i];
    const nextChar = text[i + 1];

    // Report progress periodically
    if (i % 50000 === 0) {
      const percent = Math.round(
        ((chunkIndex + i / text.length) / totalChunks) * 100
      );
      const response: ProgressMessage = {
        type: 'progress',
        percent,
        rowsParsed: rows.length,
        chunkIndex
      };
      self.postMessage(response);
    }

    if (char === quoteChar) {
      if (insideQuote && nextChar === quoteChar) {
        // Escaped quote
        currentField += quoteChar;
        i++;
      } else {
        // Toggle quote status
        insideQuote = !insideQuote;
      }
    } else if (char === delimiter && !insideQuote) {
      // End of field
      currentRow.push(currentField);
      currentField = '';
    } else if (char === '\n' && !insideQuote) {
      // End of row
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Push last field/row if exists
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  // Remove empty last row if it exists
  if (rows.length > 0 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
    rows.pop();
  }

  return rows;
}

export {};
