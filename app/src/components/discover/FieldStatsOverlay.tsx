import React from 'react';
import { Button, Modal, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import type { ValueDistribution } from '../../utils/fieldStats';

interface FieldStatsOverlayProps {
  field: string;
  distribution: ValueDistribution[];
  onClose: () => void;
  onFilter?: (value: string) => void;
}

export const FieldStatsOverlay: React.FC<FieldStatsOverlayProps> = ({ field, distribution, onClose, onFilter }) => {
  const styles = useStyles2(getStyles);

  return (
    <Modal title={`Top values for ${field}`} isOpen onDismiss={onClose} className={styles.modal}>
      {distribution.length === 0 ? (
        <p>No sampled values found for this field in the current results.</p>
      ) : (
        <table className={styles.table} data-testid="field-stats-table">
          <thead>
            <tr>
              <th>Value</th>
              <th>Count</th>
              <th>Percent</th>
              {onFilter && <th aria-label="actions" />}
            </tr>
          </thead>
          <tbody>
            {distribution.map((bucket) => (
              <tr key={bucket.value}>
                <td>{bucket.value}</td>
                <td>{bucket.count}</td>
                <td>{bucket.percentage}%</td>
                {onFilter && (
                  <td>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onFilter(bucket.value)}
                    >
                      Filter
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className={styles.footer}>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

const getStyles = () => ({
  modal: css`
    min-width: 520px;
  `,
  table: css`
    width: 100%;
    border-collapse: collapse;

    th,
    td {
      padding: 0.5rem;
      text-align: left;
      border-bottom: 1px solid var(--grafana-border-color-weak);
    }
  `,
  footer: css`
    display: flex;
    justify-content: flex-end;
    margin-top: 1rem;
  `,
});

export default FieldStatsOverlay;
