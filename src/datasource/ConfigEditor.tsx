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

  const onTimeoutChange = (event: ChangeEvent<HTMLInputElement>) => {
    const timeout = parseInt(event.target.value, 10);
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        timeout: isNaN(timeout) ? undefined : timeout,
      },
    });
  };

  const onTenantIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        tenantId: event.target.value || undefined,
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
      <div style={{ marginBottom: '16px' }}>
        <Input
          label="Timeout (seconds)"
          placeholder="30"
          type="number"
          value={options.jsonData.timeout || ''}
          onChange={onTimeoutChange}
          width={20}
        />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <Input
          label="Tenant ID (optional)"
          placeholder="your-tenant-id"
          value={options.jsonData.tenantId || ''}
          onChange={onTenantIdChange}
          width={30}
        />
      </div>
    </div>
  );
}
