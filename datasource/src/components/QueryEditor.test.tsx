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
  it('invokes onChange when raw query updates and triggers onRunQuery on blur', () => {
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

    fireEvent.click(getByRole('button', { name: /raw/i }));
    const textarea = getByRole('textbox', { name: /raw query editor/i });
    fireEvent.change(textarea, { target: { value: 'service:"payments"' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ query: 'service:"payments"' }));

    fireEvent.blur(textarea);
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

  it('allows clause builder to construct lucene query', () => {
    const onChange = jest.fn();

    const { getByRole, getByLabelText } = render(
      <QueryEditor
        query={baseQuery}
        datasource={({} as unknown) as DataSource}
        onChange={onChange}
        onRunQuery={jest.fn()}
      />
    );

    fireEvent.click(getByRole('button', { name: /add filter/i }));
    fireEvent.change(getByLabelText(/Value for clause/i), { target: { value: 'payments' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'service:"payments"' })
    );
  });
});
