import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { QueryEditor } from './QueryEditor';
import type { DataSource } from '../datasource';
import { MiradorQuery, QueryType } from '../types';

const baseQuery: MiradorQuery = {
  refId: 'A',
  queryType: QueryType.Logs,
  query: '*',
};

describe('QueryEditor', () => {
  it('invokes onChange when query string updates and triggers onRunQuery on blur', () => {
    const onChange = jest.fn();
    const onRunQuery = jest.fn();

    const { getByRole } = render(
      <QueryEditor
        query={baseQuery}
        datasource={({} as unknown) as DataSource}
        onChange={onChange}
        onRunQuery={onRunQuery}
      />
    );

    const input = getByRole('textbox', { name: /query/i });
    fireEvent.change(input, { target: { value: 'service:payments' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ query: 'service:payments' }));

    fireEvent.blur(input);
    expect(onRunQuery).toHaveBeenCalled();
  });

  it('updates limit input with numeric conversion', () => {
    const onChange = jest.fn();

    const { getByRole } = render(
      <QueryEditor
        query={baseQuery}
        datasource={({} as unknown) as DataSource}
        onChange={onChange}
        onRunQuery={jest.fn()}
      />
    );

    fireEvent.change(getByRole('spinbutton', { name: /limit/i }), { target: { value: '250' } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ limit: 250 }));
  });
});
