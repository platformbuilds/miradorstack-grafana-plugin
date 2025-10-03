import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { LinkButton, useStyles2 } from '@grafana/ui';
import { prefixRoute } from '../utils/utils.routing';
import { ROUTES } from '../constants';
import { testIds } from '../components/testIds';
import { PluginPage } from '@grafana/runtime';

function ExplorerPage() {
  const s = useStyles2(getStyles);

  return (
    <PluginPage>
      <div data-testid={testIds.pageOne.container}>
        <h1>Mirador Explorer</h1>
        <p>Welcome to the Mirador Core data exploration interface.</p>
        <p>Use the panels to explore logs, metrics, traces, and perform RCA.</p>
        <div className={s.marginTop}>
          <LinkButton data-testid={testIds.pageOne.navigateToDiscover} href={prefixRoute(ROUTES.Discover)}>
            Go to Discover
          </LinkButton>
        </div>
        <div className={s.marginTop}>
          <LinkButton data-testid={testIds.pageOne.navigateToFour} href={prefixRoute(ROUTES.Schema)}>
            Go to Schema Explorer
          </LinkButton>
        </div>
      </div>
    </PluginPage>
  );
}

export default ExplorerPage;

const getStyles = (theme: GrafanaTheme2) => ({
  marginTop: css`
    margin-top: ${theme.spacing(2)};
  `,
});
