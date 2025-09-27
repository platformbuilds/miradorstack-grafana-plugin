import type { LogDocument } from '../types/discover';

const CSV_SEPARATOR = ',';

const escapeCsv = (value: unknown) => {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  if (stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  if (stringValue.includes(CSV_SEPARATOR) || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const flattenDocument = (document: LogDocument) => {
  const attributes = document.attributes ?? {};
  return {
    id: document.id,
    timestamp: document.timestamp,
    message: document.message,
    level: document.level,
    service: document.service,
    tenant: document.tenant,
    traceId: document.traceId,
    spanId: document.spanId,
    ...attributes,
  } as Record<string, unknown>;
};

export const documentsToCsv = (documents: LogDocument[]): string => {
  if (documents.length === 0) {
    return 'id,timestamp,message';
  }

  const flattened = documents.map(flattenDocument);
  const fields = Array.from(
    flattened.reduce((acc, entry) => {
      Object.keys(entry).forEach((key) => acc.add(key));
      return acc;
    }, new Set<string>())
  );

  const header = fields.join(CSV_SEPARATOR);
  const rows = flattened.map((entry) =>
    fields
      .map((field) => escapeCsv(field in entry ? entry[field] : ''))
      .join(CSV_SEPARATOR)
  );

  return [header, ...rows].join('\n');
};

export const documentsToJson = (documents: LogDocument[]): string =>
  JSON.stringify(documents, null, 2);

export const triggerDownload = (filename: string, contents: string, mimeType: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  const blob = new Blob([contents], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
};

export const downloadDocuments = (documents: LogDocument[], format: 'csv' | 'json') => {
  if (format === 'csv') {
    const csv = documentsToCsv(documents);
    triggerDownload('discover-export.csv', csv, 'text/csv');
    return;
  }

  const json = documentsToJson(documents);
  triggerDownload('discover-export.json', json, 'application/json');
};
