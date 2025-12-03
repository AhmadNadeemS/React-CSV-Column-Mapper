import CsvWorker from 'web-worker:../workers/csv-parser.worker';
import { ParseMessage, ProgressMessage, ResultMessage, ErrorMessage } from '../workers/csv-parser.worker';

export interface CsvParserOptions {
  delimiter?: string;
  quoteChar?: string;
  encoding?: string;
}

export interface ParseProgress {
  percent: number;
  rowsParsed: number;
}

export class CsvParser {
  private defaultOptions: CsvParserOptions = {
    delimiter: ',',
    quoteChar: '"',
    encoding: 'UTF-8'
  };

  private worker: Worker | null = null;

  /**
   * Parse a File object or string content with chunked processing via Web Worker
   */
  async parse(
    input: File | string,
    options: CsvParserOptions = {},
    signal?: AbortSignal,
    onProgress?: (progress: ParseProgress) => void
  ): Promise<string[][]> {
    const config = { ...this.defaultOptions, ...options };

    // Check if already aborted
    if (signal?.aborted) {
      throw new DOMException('Parsing was aborted', 'AbortError');
    }

    // Initialize worker
    this.worker = new CsvWorker();

    return new Promise(async (resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Failed to initialize worker'));
        return;
      }

      const rows: string[][] = [];
      let processedChunks = 0;
      const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

      // Handle worker messages
      this.worker.onmessage = (e: MessageEvent<ProgressMessage | ResultMessage | ErrorMessage>) => {
        const message = e.data;

        if (message.type === 'progress') {
          if (onProgress) {
            onProgress({
              percent: message.percent,
              rowsParsed: message.rowsParsed
            });
          }
        } else if (message.type === 'result') {
          // Append rows
          rows.push(...message.rows);
          processedChunks++;

          // Check if complete
          if (message.isComplete) {
            this.cleanup();
            resolve(rows);
          }
        } else if (message.type === 'error') {
          this.cleanup();
          reject(new Error(message.error));
        }
      };

      this.worker.onerror = (e) => {
        this.cleanup();
        reject(new Error('Worker error: ' + e.message));
      };

      // Handle cancellation
      if (signal) {
        signal.addEventListener('abort', () => {
          if (this.worker) {
            this.worker.postMessage({ type: 'cancel' });
            this.cleanup();
            reject(new DOMException('Parsing was aborted', 'AbortError'));
          }
        });
      }

      // Process input
      try {
        if (input instanceof File) {
          const totalChunks = Math.ceil(input.size / CHUNK_SIZE);
          let offset = 0;
          let chunkIndex = 0;

          const readNextChunk = () => {
            if (signal?.aborted) return;
            if (offset >= input.size) return;

            const chunk = input.slice(offset, offset + CHUNK_SIZE);
            const reader = new FileReader();

            reader.onload = (e) => {
              if (signal?.aborted) return;
              const text = e.target?.result as string;

              this.worker?.postMessage({
                type: 'parse',
                text,
                delimiter: config.delimiter || ',',
                quoteChar: config.quoteChar || '"',
                chunkIndex,
                totalChunks
              });

              offset += CHUNK_SIZE;
              chunkIndex++;

              // Read next chunk immediately - worker handles queue
              readNextChunk();
            };

            reader.onerror = (e) => {
              this.cleanup();
              reject(e);
            };

            reader.readAsText(chunk, config.encoding);
          };

          readNextChunk();
        } else {
          // String input
          this.worker.postMessage({
            type: 'parse',
            text: input,
            delimiter: config.delimiter || ',',
            quoteChar: config.quoteChar || '"',
            chunkIndex: 0,
            totalChunks: 1
          });
        }
      } catch (err) {
        this.cleanup();
        reject(err);
      }
    });
  }

  cleanup() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
