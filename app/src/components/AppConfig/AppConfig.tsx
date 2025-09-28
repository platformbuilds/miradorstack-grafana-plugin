import React, { ChangeEvent, useState } from 'react';
import { lastValueFrom } from 'rxjs';
import { css } from '@emotion/css';
import { AppPluginMeta, GrafanaTheme2, PluginConfigPageProps, PluginMeta } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { Button, Field, FieldSet, Input, SecretInput, useStyles2 } from '@grafana/ui';
import { testIds } from '../testIds';
import pluginJson from '../../plugin.json';

type AppPluginSettings = {
  apiUrl?: string;
  datasourceUid?: string;
};

type State = {
  // The URL to reach our custom API.
  apiUrl: string;
  // Tells us if the API key secret is set.
  isApiKeySet: boolean;
  // A secret key for our custom API.
  apiKey: string;
  datasourceUid: string;
};

export interface AppConfigProps extends PluginConfigPageProps<AppPluginMeta<AppPluginSettings>> {}

const AppConfig = ({ plugin }: AppConfigProps) => {
  const s = useStyles2(getStyles);
  const meta = (plugin?.meta as AppPluginMeta<AppPluginSettings> | undefined) ?? ({} as AppPluginMeta<AppPluginSettings>);
  const enabled = Boolean(meta?.enabled);
  const pinned = Boolean(meta?.pinned);
  const jsonData = meta?.jsonData ?? {};
  const secureJsonFields = meta?.secureJsonFields ?? {};
  const pluginId = meta?.id ?? pluginJson.id;
  const [state, setState] = useState<State>({
    apiUrl: jsonData?.apiUrl || '',
    apiKey: '',
    isApiKeySet: Boolean((secureJsonFields as Record<string, unknown>)?.apiKey),
    datasourceUid: jsonData?.datasourceUid || '',
  });

  const isSubmitDisabled = Boolean(
    !state.apiUrl || (!state.isApiKeySet && !state.apiKey) || !state.datasourceUid
  );

  const onResetApiKey = () =>
    setState({
      ...state,
      apiKey: '',
      isApiKeySet: false,
    });

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      [event.target.name]: event.target.value.trim(),
    });
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitDisabled) {
      return;
    }

    updatePluginAndReload(pluginId, {
      enabled,
      pinned,
      jsonData: {
        apiUrl: state.apiUrl,
        datasourceUid: state.datasourceUid,
      },
      // This cannot be queried later by the frontend.
      // We don't want to override it in case it was set previously and left untouched now.
      secureJsonData: state.isApiKeySet
        ? undefined
        : {
            apiKey: state.apiKey,
          },
    });
  };

  return (
    <form className="config-form" onSubmit={onSubmit}>
      <FieldSet label="API Settings">
        <Field label="API Key" description="A secret key for authenticating to our custom API">
          <SecretInput
            width={60}
            id="config-api-key"
            data-testid={testIds.appConfig.apiKey}
            name="apiKey"
            value={state.apiKey}
            isConfigured={state.isApiKeySet}
            placeholder={'Your secret API key'}
            onChange={onChange}
            onReset={onResetApiKey}
          />
        </Field>

        <Field label="API Url" description="" className={s.marginTop}>
          <Input
            width={60}
            name="apiUrl"
            id="config-api-url"
            data-testid={testIds.appConfig.apiUrl}
            value={state.apiUrl}
            placeholder={`E.g.: http://mywebsite.com/api/v1`}
            onChange={onChange}
          />
        </Field>

        <Field
          label="Mirador datasource UID"
          description="UID of the Mirador Core Connector datasource to surface schema services"
          className={s.marginTop}
        >
          <Input
            width={60}
            name="datasourceUid"
            id="config-datasource-uid"
            data-testid={testIds.appConfig.datasourceUid}
            value={state.datasourceUid}
            placeholder={`E.g.: mirador-core`}
            onChange={onChange}
          />
        </Field>

        <div className={s.marginTop}>
          <Button type="submit" data-testid={testIds.appConfig.submit} disabled={isSubmitDisabled}>
            Save API settings
          </Button>
        </div>
      </FieldSet>
    </form>
  );
};

export default AppConfig;

const getStyles = (theme: GrafanaTheme2) => ({
  colorWeak: css`
    color: ${theme.colors.text.secondary};
  `,
  marginTop: css`
    margin-top: ${theme.spacing(3)};
  `,
});

const updatePluginAndReload = async (pluginId: string, data: Partial<PluginMeta<AppPluginSettings>>) => {
  try {
    await updatePlugin(pluginId, data);

    // Reloading the page as the changes made here wouldn't be propagated to the actual plugin otherwise.
    // This is not ideal, however unfortunately currently there is no supported way for updating the plugin state.
    window.location.reload();
  } catch (e) {
    console.error('Error while updating the plugin', e);
  }
};

const updatePlugin = async (pluginId: string, data: Partial<PluginMeta>) => {
  const response = await getBackendSrv().fetch({
    url: `/api/plugins/${pluginId}/settings`,
    method: 'POST',
    data,
  });

  return lastValueFrom(response);
};
