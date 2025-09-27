import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import type { LogDocument } from '../../types/discover';
import { DocumentRowDetails } from './DocumentRowDetails';

interface DocumentTableProps {
  documents: LogDocument[];
  pinnedFields: string[];
}

const ROW_HEIGHT = 96;
const BUFFER_ROWS = 8;

export const DocumentTable: React.FC<DocumentTableProps> = ({ documents, pinnedFields }) => {
  const styles = useStyles2(getStyles);
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [windowRange, setWindowRange] = useState({ start: 0, end: Math.min(documents.length, 20) });

  useEffect(() => {
    setWindowRange({ start: 0, end: Math.min(documents.length, 20) });
  }, [documents.length]);

  const orderedPinnedFields = useMemo(() => Array.from(new Set(pinnedFields)), [pinnedFields]);

  const totalHeight = documents.length * ROW_HEIGHT;

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const scrollTop = container.scrollTop;
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS);
    const end = Math.min(documents.length, start + BUFFER_ROWS * 4);
    setWindowRange({ start, end });
  };

  const visibleDocuments = documents.slice(windowRange.start, windowRange.end);

  useEffect(() => {
    handleScroll();
  }, [documents]);

  return (
    <section className={styles.container} data-testid="discover-document-table">
      <div className={styles.scrollArea} ref={containerRef} onScroll={handleScroll}>
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${windowRange.start * ROW_HEIGHT}px)` }}>
            {visibleDocuments.map((doc) => {
              const expanded = expandedRows.has(doc.id);
              return (
                <div key={doc.id} className={styles.row} data-testid={`document-row-${doc.id}`}>
                  <Card className={cx(styles.card, expanded && styles.cardExpanded)}>
                    <Card.Heading>
                      <div className={styles.headerRow}>
                        <div className={styles.headingGroup}>
                          <Badge text={doc.level} color={badgeColor(doc.level)} />
                          <strong>{doc.service}</strong>
                          <span className={styles.timestamp}>{new Date(doc.timestamp).toLocaleString()}</span>
                        </div>
                        <Button
                          size="sm"
                          icon={expanded ? 'angle-down' : 'angle-right'}
                          variant="secondary"
                          onClick={() =>
                            setExpandedRows((current) => {
                              const clone = new Set(current);
                              if (clone.has(doc.id)) {
                                clone.delete(doc.id);
                              } else {
                                clone.add(doc.id);
                              }
                              return clone;
                            })
                          }
                        >
                          {expanded ? 'Hide details' : 'View details'}
                        </Button>
                      </div>
                    </Card.Heading>
                    <Card.Meta>
                      <span>{doc.message}</span>
                    </Card.Meta>
                    <Card.Figure>
                      <div className={styles.pinnedValues}>
                        {orderedPinnedFields.map((field) => {
                          const value = getDocumentField(doc, field);
                          if (value === undefined) {
                            return null;
                          }
                          return (
                            <span key={field} className={styles.pill}>
                              <strong>{field}:</strong> {String(value)}
                            </span>
                          );
                        })}
                      </div>
                    </Card.Figure>
                    {expanded && (
                      <Card.Actions>
                        <DocumentRowDetails document={doc} />
                      </Card.Actions>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {documents.length === 0 && <p className={styles.empty}>No documents match your filters.</p>}
    </section>
  );
};

const badgeColor = (level: string) => {
  switch (level.toUpperCase()) {
    case 'DEBUG':
      return 'blue';
    case 'INFO':
      return 'green';
    case 'WARN':
      return 'orange';
    case 'ERROR':
      return 'red';
    default:
      return 'brand';
  }
};

const getDocumentField = (doc: LogDocument, field: string) => {
  const attributes = doc.attributes as Record<string, unknown>;
  if (attributes[field] !== undefined) {
    return attributes[field];
  }
  return (doc as unknown as Record<string, unknown>)[field];
};

const getStyles = () => ({
  container: css`
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    position: relative;
  `,
  scrollArea: css`
    overflow-y: auto;
    height: 100%;
  `,
  row: css`
    height: ${ROW_HEIGHT}px;
    padding: 0.4rem 0;
  `,
  card: css`
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  `,
  headerRow: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
  `,
  headingGroup: css`
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  `,
  cardExpanded: css`
    background: var(--grafana-background-canvas);
  `,
  timestamp: css`
    font-size: 12px;
    color: var(--grafana-text-secondary);
  `,
  pinnedValues: css`
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  `,
  pill: css`
    background: var(--grafana-background-secondary);
    border-radius: 4px;
    padding: 0.2rem 0.4rem;
    font-size: 12px;
  `,
  empty: css`
    margin-top: 2rem;
    text-align: center;
    color: var(--grafana-text-secondary);
  `,
});
