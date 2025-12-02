export interface CsvParserOptions {
  delimiter?: string;
  quoteChar?: string;
  encoding?: string;
}

export class CsvParser {
  private defaultOptions: CsvParserOptions = {
    delimiter: ',',
    quoteChar: '"',
    encoding: 'UTF-8'
  };

  /**
   * Parse a File object or string content
   */
  async parse(input: File | string, options: CsvParserOptions = {}): Promise<string[][]> {
    const config = { ...this.defaultOptions, ...options };

    let content = '';
    if (input instanceof File) {
      content = await this.readFile(input, config.encoding);
    } else {
      content = input;
    }

    return this.parseString(content, config);
  }

  private readFile(file: File, encoding?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file, encoding);
    });
  }

  private parseString(text: string, config: CsvParserOptions): string[][] {
    const { delimiter, quoteChar } = config;
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let insideQuote = false;

    // Normalize line endings
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

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

    // Remove empty last row if it exists (common in CSVs)
    if (rows.length > 0 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
      rows.pop();
    }

    return rows;
  }
}
