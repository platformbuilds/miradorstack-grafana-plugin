import React from 'react';
import { SecretInput, Input, Field } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MiradorDataSourceOptions, MiradorSecureJsonData } from '../QueryEditor/types';

interface Props extends DataSourcePluginOptionsEditorProps<MiradorDataSourceOptions, MiradorSecureJsonData> {}

export const ConfigEditor: React.FC<Props> = ({ options, onOptionsChange }) => {
  const validateURL = (url: string): string | null => {
    if (!url.trim()) {
      return 'URL is required';
    }
    try {
      new URL(url);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  };

  const onBaseURLChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newURL = event.target.value;
    const error = validateURL(newURL);
    
    const jsonData = {
      ...options.jsonData,
      baseURL: newURL,
      error: error, // Store validation error in jsonData
    };
    
    onOptionsChange({
      ...options,
      jsonData,
    });
  };

  const onAuthTokenChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const secureJsonData = {
      ...options.secureJsonData,
      authToken: event.target.value,
    };
    onOptionsChange({ ...options, secureJsonData });
  };

  const { jsonData, secureJsonData } = options;

  return (
    <div className="gf-form-group">
      <Field 
        label="Base URL" 
        description="Enter the base URL of your Mirador Core API"
        invalid={Boolean(jsonData.error)}
        error={jsonData.error}
      >
        <Input
          value={jsonData.baseURL || ''}
          onChange={onBaseURLChange}
          placeholder="http://localhost:8080"
        />
      </Field>

      <Field label="Auth Token" description="Enter your authentication token">
        <SecretInput
          value={secureJsonData?.authToken || ''}
          isConfigured={(options.secureJsonFields && options.secureJsonFields.authToken) || false}
          onChange={onAuthTokenChange}
          onReset={() => {
            onOptionsChange({
              ...options,
              secureJsonFields: {
                ...options.secureJsonFields,
                authToken: false,
              },
              secureJsonData: {
                ...options.secureJsonData,
                authToken: '',
              },
            });
          }}
          placeholder="Enter your auth token"
        />
      </Field>
    </div>
  );
};

export default ConfigEditor;