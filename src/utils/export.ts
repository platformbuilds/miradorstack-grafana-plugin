/**
 * Utility functions for exporting data in various formats
 */

export type ExportFormat = 'csv' | 'json';

export interface ExportOptions {
  filename?: string;
  format: ExportFormat;
}

/**
 * Converts data to CSV format
 */
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add headers
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Downloads data in the specified format
 */
export function exportData(data: any[], options: ExportOptions): void {
  const { filename = 'export', format } = options;

  let content: string;
  let mimeType: string;
  let extension: string;

  switch (format) {
    case 'csv':
      content = convertToCSV(data);
      mimeType = 'text/csv';
      extension = 'csv';
      break;
    case 'json':
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      extension = 'json';
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }

  // Create and trigger download
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Exports data with streaming support for large datasets
 * Note: For now, this is a simple implementation. In a production environment,
 * you might want to implement chunked downloads or server-side streaming.
 */
export function exportLargeData(data: any[], options: ExportOptions): void {
  // For large datasets, we could implement chunked processing
  // For now, just use the regular export
  exportData(data, options);
}
