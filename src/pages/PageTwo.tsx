import React from 'react';
import { testIds } from '../components/testIds';
import { PluginPage } from '@grafana/runtime';

function SchemaPage() {
  return (
    <PluginPage>
      <div data-testid={testIds.pageTwo.container}>
        <h1>Schema Explorer</h1>
        <p>Browse and manage schemas for metrics, logs, and traces from Mirador Core.</p>
      </div>
    </PluginPage>
  );
}

export default SchemaPage;
