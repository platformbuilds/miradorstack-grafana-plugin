import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FieldSidebar } from '../FieldSidebar';
import type { FieldStat } from '../../../types/discover';

describe('FieldSidebar', () => {
  const stats: FieldStat[] = [
    { name: 'service', type: 'string', count: 10, examples: ['payments', 'checkout'] },
    { name: 'durationMs', type: 'number', count: 4, examples: [120, 640] },
  ];

  it('filters fields by search', () => {
    render(
      <FieldSidebar
        stats={stats}
        pinnedFields={[]}
        onTogglePin={jest.fn()}
        onAddFilter={jest.fn()}
        onShowStats={jest.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Search fields'), { target: { value: 'duration' } });
    expect(screen.getByText('durationMs')).toBeInTheDocument();
    expect(screen.queryByText('service')).not.toBeInTheDocument();
  });

  it('invokes callbacks for quick filter', () => {
    const onAddFilter = jest.fn();
    const onShowStats = jest.fn();
    render(
      <FieldSidebar
        stats={stats}
        pinnedFields={[]}
        onTogglePin={jest.fn()}
        onAddFilter={onAddFilter}
        onShowStats={onShowStats}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Add filter for service/i }));
    expect(onAddFilter).toHaveBeenCalledWith('service');

    fireEvent.click(screen.getByRole('button', { name: /Show stats for service/i }));
    expect(onShowStats).toHaveBeenCalledWith('service');
  });
});
