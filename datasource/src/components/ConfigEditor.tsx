import React, { ChangeEvent } from 'react';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { InlineField, Input, SecretInput, Switch } from '@grafana/ui';
import { MiradorDataSourceOptions, MiradorSecureJsonData } from '../types';

interface Props
  extends DataSourcePluginOptionsEditorProps<MiradorDataSourceOptions, MiradorSecureJsonData> {}

export function ConfigEditor(props: Props) {
  const { onOptionsChange, options } = props;
  const { jsonData, secureJsonFields, secureJsonData } = options;

  const onUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        url: event.target.value,
      },
    });
  };

  const onTenantIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        tenantId: event.target.value,
      },
    });
  };

  const onToggleWebSocket = (value: boolean) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        enableWebSocket: value,
      },
    });
  };

  const onBearerTokenChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      secureJsonData: {
        bearerToken: event.target.value,
      },
    });
  };

  const onWebSocketUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        websocketUrl: event.target.value,
      },
    });
  };

  const onResetBearerToken = () => {
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        bearerToken: false,
      },
      secureJsonData: {
        ...options.secureJsonData,
        bearerToken: '',
      },
    });
  };

  return (
    <>
      <InlineField
        label="Mirador API URL"
        labelWidth={18}
        interactive
        tooltip={'Base URL for the Mirador Core API, e.g. https://mirador.example.com'}
      >
        <Input
          id="config-editor-url"
          onChange={onUrlChange}
          value={jsonData.url || ''}
          placeholder="https://mirador.example.com"
          width={45}
        />
      </InlineField>

      <InlineField
        label="WebSocket URL"
        labelWidth={18}
        interactive
        tooltip={'Optional direct WebSocket endpoint, defaults to Mirador API URL'}
      >
        <Input
          id="config-editor-websocket-url"
          onChange={onWebSocketUrlChange}
          value={jsonData.websocketUrl || ''}
          placeholder="wss://mirador.example.com/api/v1/logs/stream"
          width={45}
        />
      </InlineField>

      <InlineField label="Tenant ID" labelWidth={18} interactive tooltip={'Optional tenant/workspace identifier'}>
        <Input
          id="config-editor-tenant"
          onChange={onTenantIdChange}
          value={jsonData.tenantId || ''}
          placeholder="tenant-123"
          width={30}
        />
      </InlineField>

      <InlineField
        label="Enable WebSocket"
        labelWidth={18}
        interactive
        tooltip={'Toggle real-time log streaming via Mirador WebSocket API'}
      >
        <Switch
          id="config-editor-websocket"
          value={Boolean(jsonData.enableWebSocket)}
          onChange={(event) => onToggleWebSocket(event.currentTarget.checked)}
        />
      </InlineField>

      <InlineField
        label="Bearer Token"
        labelWidth={18}
        interactive
        tooltip={'Secure token used to authenticate with Mirador Core'}
      >
        <SecretInput
          required
          id="config-editor-bearer"
          isConfigured={Boolean(secureJsonFields?.bearerToken)}
          value={secureJsonData?.bearerToken}
          placeholder="Paste bearer token"
          width={45}
          onReset={onResetBearerToken}
          onChange={onBearerTokenChange}
        />
      </InlineField>
    </>
  );
}
