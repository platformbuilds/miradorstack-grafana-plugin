import React, { ChangeEvent } from 'react';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { Input, SecretInput } from '@grafana/ui';
import { MiradorDataSourceOptions, MiradorSecureData } from './MiradorDataSource';

interface Props extends DataSourcePluginOptionsEditorProps<MiradorDataSourceOptions, MiradorSecureData> {}

export function ConfigEditor(props: Props) {
  const { options, onOptionsChange } = props;

  const onUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        url: event.target.value,
      },
    });
  };

  const onTokenChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      secureJsonData: {
        ...options.secureJsonData,
        bearerToken: event.target.value,
      },
    });
  };

  return (
    <div>
      <h3>Mirador Core Connection</h3>
      <div style={{ marginBottom: '16px' }}>
        <Input
          label="Mirador Core URL"
          placeholder="http://localhost:8080/api/v1"
          value={options.jsonData.url || ''}
          onChange={onUrlChange}
          width={50}
        />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <SecretInput
          label="Bearer Token"
          placeholder="Enter your Bearer token"
          value={options.secureJsonData?.bearerToken || ''}
          onChange={onTokenChange}
          onReset={() => {
            onOptionsChange({
              ...options,
              secureJsonData: {
                ...options.secureJsonData,
                bearerToken: '',
              },
            });
          }}
          width={50}
          isConfigured={!!options.secureJsonData?.bearerToken}
        />
      </div>
    </div>
  );
}