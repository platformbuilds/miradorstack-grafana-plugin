import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { ConfigEditor } from './ConfigEditor';
import type { MiradorDataSourceOptions, MiradorSecureJsonData } from '../types';

function setup(overrides?: Partial<MiradorDataSourceOptions>) {
  const onOptionsChange = jest.fn();
  const options = {
    id: 1,
    type: 'miradorstack-miradorcoreconnector-datasource',
    access: 'proxy' as const,
    jsonData: {
      url: '',
      tenantId: '',
      enableWebSocket: false,
      ...overrides,
    },
    secureJsonData: {} as MiradorSecureJsonData,
    secureJsonFields: {},
  };

  const utils = render(<ConfigEditor options={options as any} onOptionsChange={onOptionsChange} />);
  return { ...utils, onOptionsChange };
}

describe('ConfigEditor', () => {
  it('updates URL field', () => {
    const { getByRole, onOptionsChange } = setup();

    fireEvent.change(getByRole('textbox', { name: /mirador api url/i }), {
      target: { value: 'https://mirador.local' },
    });

    expect(onOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        jsonData: expect.objectContaining({ url: 'https://mirador.local' }),
      })
    );
  });

  it('toggles websocket switch', () => {
    const { getByRole, onOptionsChange } = setup();

    fireEvent.click(getByRole('switch', { name: /enable websocket/i }));

    expect(onOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        jsonData: expect.objectContaining({ enableWebSocket: true }),
      })
    );
  });

  it('updates websocket url field', () => {
    const { getByRole, onOptionsChange } = setup();

    fireEvent.change(getByRole('textbox', { name: /websocket url/i }), {
      target: { value: 'wss://mirador.local/stream' },
    });

    expect(onOptionsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        jsonData: expect.objectContaining({ websocketUrl: 'wss://mirador.local/stream' }),
      })
    );
  });
});
