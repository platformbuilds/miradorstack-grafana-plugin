import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Input, Select, IconButton, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { QueryHistoryItem } from '../types/search';
import { queryHistoryManager } from '../utils/queryHistory';

interface QueryHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: 'discover' | 'reports' | 'ai-insights';
  onLoadQuery: (query: QueryHistoryItem) => void;
}

export const QueryHistoryModal: React.FC<QueryHistoryModalProps> = ({
  isOpen,
  onClose,
  currentPage,
  onLoadQuery,
}) => {
  const styles = useStyles2(getStyles);
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPage, setFilterPage] = useState<'all' | 'discover' | 'reports' | 'ai-insights'>('all');
  const [showFavorites, setShowFavorites] = useState(false);

  const loadHistory = useCallback(() => {
    let items: QueryHistoryItem[];

    if (showFavorites) {
      items = filterPage === 'all'
        ? queryHistoryManager.getFavorites()
        : queryHistoryManager.getFavorites(filterPage);
    } else {
      items = filterPage === 'all'
        ? queryHistoryManager.getHistory()
        : queryHistoryManager.getHistory(filterPage);
    }

    if (searchQuery.trim()) {
      items = queryHistoryManager.searchHistory(searchQuery, filterPage === 'all' ? undefined : filterPage);
      if (showFavorites) {
        items = items.filter(item => item.isFavorite);
      }
    }

    setHistory(items);
  }, [showFavorites, filterPage, searchQuery]);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, filterPage, showFavorites, loadHistory]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Reload history with new search
    setTimeout(loadHistory, 0);
  };

  const handleToggleFavorite = (id: string) => {
    queryHistoryManager.toggleFavorite(id);
    loadHistory();
  };

  const handleDelete = (id: string) => {
    queryHistoryManager.deleteFromHistory(id);
    loadHistory();
  };

  const handleLoad = (item: QueryHistoryItem) => {
    onLoadQuery(item);
    onClose();
  };

  const handleClearHistory = () => {
    if (filterPage === 'all') {
      queryHistoryManager.clearHistory();
    } else {
      queryHistoryManager.clearHistory(filterPage);
    }
    loadHistory();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {return 'Just now';}
    if (diffMins < 60) {return `${diffMins}m ago`;}
    if (diffHours < 24) {return `${diffHours}h ago`;}
    if (diffDays < 7) {return `${diffDays}d ago`;}

    return date.toLocaleDateString();
  };

  return (
    <Modal isOpen={isOpen} title="Query History" onDismiss={onClose} className={styles.modal}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Input
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.currentTarget.value)}
            className={styles.searchInput}
          />

          <div className={styles.filters}>
            <Select
              options={[
                { label: 'All Pages', value: 'all' },
                { label: 'Discover', value: 'discover' },
                { label: 'Reports', value: 'reports' },
                { label: 'AI Insights', value: 'ai-insights' },
              ]}
              value={filterPage}
              onChange={(value) => setFilterPage(value.value as any)}
              className={styles.filterSelect}
            />

            <Button
              variant={showFavorites ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowFavorites(!showFavorites)}
            >
              ⭐ Favorites
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearHistory}
            >
              Clear History
            </Button>
          </div>
        </div>

        <div className={styles.historyList}>
          {history.length === 0 ? (
            <div className={styles.empty}>
              {searchQuery ? 'No queries found matching your search.' :
               showFavorites ? 'No favorite queries yet.' :
               'No query history yet.'}
            </div>
          ) : (
            history.map(item => (
              <div key={item.id} className={styles.historyItem}>
                <div className={styles.queryInfo}>
                  <div className={styles.queryText}>{item.query}</div>
                  <div className={styles.queryMeta}>
                    <span className={styles.page}>{item.page}</span>
                    <span className={styles.timestamp}>{formatTimestamp(item.timestamp)}</span>
                    {item.resultCount && (
                      <span className={styles.resultCount}>{item.resultCount} results</span>
                    )}
                    {item.executionTime && (
                      <span className={styles.executionTime}>{item.executionTime}ms</span>
                    )}
                  </div>
                </div>
                <div className={styles.actions}>
                  <Button variant="secondary" size="sm" onClick={() => handleLoad(item)}>
                    Load
                  </Button>
                  <IconButton
                    name={item.isFavorite ? 'favorite' : 'star'}
                    size="sm"
                    onClick={() => handleToggleFavorite(item.id)}
                    tooltip={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  />
                  <IconButton
                    name="trash-alt"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    tooltip="Delete from history"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

const getStyles = (theme: any) => ({
  modal: css`
    width: 700px;
    max-height: 80vh;
  `,
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
  `,
  header: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
  `,
  searchInput: css`
    width: 100%;
  `,
  filters: css`
    display: flex;
    gap: ${theme.spacing(1)};
    align-items: center;
  `,
  filterSelect: css`
    min-width: 120px;
  `,
  historyList: css`
    max-height: 400px;
    overflow-y: auto;
  `,
  historyItem: css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: ${theme.spacing(2)};
    border: 1px solid ${theme.colors.border.medium};
    border-radius: ${theme.shape.borderRadius()};
    margin-bottom: ${theme.spacing(1)};
    background: ${theme.colors.background.secondary};
    &:hover {
      background: ${theme.colors.background.primary};
    }
  `,
  queryInfo: css`
    flex: 1;
    min-width: 0;
  `,
  queryText: css`
    font-family: ${theme.typography.fontFamily.monospace};
    font-size: ${theme.typography.size.sm};
    word-break: break-all;
    margin-bottom: ${theme.spacing(1)};
  `,
  queryMeta: css`
    display: flex;
    gap: ${theme.spacing(2)};
    font-size: ${theme.typography.size.xs};
    color: ${theme.colors.text.secondary};
    flex-wrap: wrap;
  `,
  page: css`
    background: ${theme.colors.background.primary};
    padding: ${theme.spacing(0.25)} ${theme.spacing(0.5)};
    border-radius: ${theme.shape.borderRadius()};
    text-transform: capitalize;
  `,
  timestamp: css``,
  resultCount: css`
    color: ${theme.colors.success.main};
  `,
  executionTime: css`
    color: ${theme.colors.info.main};
  `,
  actions: css`
    display: flex;
    gap: ${theme.spacing(1)};
    align-items: center;
    margin-left: ${theme.spacing(2)};
  `,
  empty: css`
    text-align: center;
    padding: ${theme.spacing(4)};
    color: ${theme.colors.text.secondary};
  `,
});
