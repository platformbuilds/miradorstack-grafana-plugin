import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TimeHistogram } from '../TimeHistogram';
import { dateTime, type TimeRange } from '@grafana/data';

describe('TimeHistogram', () => {
  it('emits bucket range when clicking overlay', () => {
    const onSelect = jest.fn();
    const buckets = [
      { time: dateTime().subtract(2, 'minutes').toISOString(), count: 3 },
      { time: dateTime().subtract(1, 'minutes').toISOString(), count: 5 },
    ];

    const to = dateTime();
    const from = dateTime(to.valueOf()).subtract(5, 'minutes');
    const timeRange = {
      from,
      to,
      raw: { from: 'now-5m', to: 'now' },
    } as TimeRange;

    render(
      <TimeHistogram
        buckets={buckets}
        loading={false}
        timeRange={timeRange}
        onBucketSelect={onSelect}
      />
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
