import React from 'react';
import { render, screen } from '@testing-library/react';
import { DocumentTable } from '../DocumentTable';
import type { LogDocument } from '../../../types/discover';

describe('DocumentTable virtualization', () => {
  const documents: LogDocument[] = Array.from({ length: 200 }).map((_, index) => ({
    id: `doc-${index}`,
    timestamp: new Date().toISOString(),
    message: `log message ${index}`,
    level: index % 2 === 0 ? 'INFO' : 'WARN',
    service: 'payments',
    attributes: { key: `value-${index}` },
  }));

  it('renders a limited number of DOM rows initially', () => {
    render(<DocumentTable documents={documents} pinnedFields={['service']} />);
    const rows = screen.getAllByTestId(/document-row-/i);
    expect(rows.length).toBeLessThan(80);
  });
});
