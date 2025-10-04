import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, TextArea, IconButton, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { SavedSearch } from '../types/search';
import { savedSearchManager } from '../utils/savedSearches';

interface SavedSearchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: 'reports' | 'ai-insights';
  currentQuery: string;
  currentFilters: Record<string, any>;
  currentTimeRange: string;
  onLoadSearch: (search: SavedSearch) => void;
}

export const SavedSearchesModal: React.FC<SavedSearchesModalProps> = ({
  isOpen,
  onClose,
  currentPage,
  currentQuery,
  currentFilters,
  currentTimeRange,
  onLoadSearch,
}) => {
  const styles = useStyles2(getStyles);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveForm, setSaveForm] = useState({
    name: '',
    description: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSearches(savedSearchManager.getSearchesByPage(currentPage));
    }
  }, [isOpen, currentPage]);

  const handleSave = () => {
    if (!saveForm.name.trim()) {return;}

    const newSearch = savedSearchManager.saveSearch({
      name: saveForm.name.trim(),
      description: saveForm.description.trim() || undefined,
      query: currentQuery,
      filters: currentFilters,
      timeRange: currentTimeRange,
      page: currentPage,
      tags: saveForm.tags.length > 0 ? saveForm.tags : undefined,
    });

    setSearches(prev => [...prev, newSearch]);
    setSaveForm({ name: '', description: '', tags: [] });
    setShowSaveForm(false);
  };

  const handleDelete = (id: string) => {
    savedSearchManager.deleteSearch(id);
    setSearches(prev => prev.filter(s => s.id !== id));
  };

  const handleLoad = (search: SavedSearch) => {
    onLoadSearch(search);
    onClose();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setSearches(savedSearchManager.searchSearches(query, currentPage));
    } else {
      setSearches(savedSearchManager.getSearchesByPage(currentPage));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !saveForm.tags.includes(tagInput.trim())) {
      setSaveForm(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSaveForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  return (
    <Modal isOpen={isOpen} title="Saved Searches" onDismiss={onClose} className={styles.modal}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Input
            placeholder="Search saved searches..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.currentTarget.value)}
            className={styles.searchInput}
          />
          <Button
            variant="primary"
            onClick={() => setShowSaveForm(true)}
            disabled={!currentQuery.trim()}
          >
            Save Current Search
          </Button>
        </div>

        {showSaveForm && (
          <div className={styles.saveForm}>
            <h4>Save Current Search</h4>
            <Input
              placeholder="Search name"
              value={saveForm.name}
              onChange={(e) => setSaveForm(prev => ({ ...prev, name: e.currentTarget.value }))}
              className={styles.input}
            />
            <TextArea
              placeholder="Description (optional)"
              value={saveForm.description}
              onChange={(e) => setSaveForm(prev => ({ ...prev, description: e.currentTarget.value }))}
              rows={2}
              className={styles.input}
            />
            <div className={styles.tagSection}>
              <div className={styles.tagInput}>
                <Input
                  placeholder="Add tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.currentTarget.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button variant="secondary" onClick={addTag} size="sm">
                  Add
                </Button>
              </div>
              <div className={styles.tags}>
                {saveForm.tags.map((tag: string) => (
                  <span key={tag} className={styles.tag} onClick={() => removeTag(tag)}>
                    {tag} ×
                  </span>
                ))}
              </div>
            </div>
            <div className={styles.formActions}>
              <Button variant="secondary" onClick={() => setShowSaveForm(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={!saveForm.name.trim()}>
                Save
              </Button>
            </div>
          </div>
        )}

        <div className={styles.searchesList}>
          {searches.length === 0 ? (
            <div className={styles.empty}>
              {searchQuery ? 'No searches found matching your query.' : 'No saved searches yet.'}
            </div>
          ) : (
            searches.map(search => (
              <div key={search.id} className={styles.searchItem}>
                <div className={styles.searchInfo}>
                  <h5>{search.name}</h5>
                  {search.description && <p>{search.description}</p>}
                  <div className={styles.searchMeta}>
                    <span>Query: {search.query}</span>
                    <span>Updated: {new Date(search.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {search.tags && search.tags.length > 0 && (
                    <div className={styles.tags}>
                      {search.tags.map((tag: string) => (
                        <span key={tag} className={styles.tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.searchActions}>
                  <Button variant="secondary" size="sm" onClick={() => handleLoad(search)}>
                    Load
                  </Button>
                  <IconButton
                    name="trash-alt"
                    size="sm"
                    onClick={() => handleDelete(search.id)}
                    tooltip="Delete search"
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
    width: 600px;
  `,
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
  `,
  header: css`
    display: flex;
    gap: ${theme.spacing(2)};
    align-items: center;
  `,
  searchInput: css`
    flex: 1;
  `,
  saveForm: css`
    padding: ${theme.spacing(2)};
    border: 1px solid ${theme.colors.border.medium};
    border-radius: ${theme.shape.borderRadius()};
    background: ${theme.colors.background.secondary};
  `,
  input: css`
    margin-bottom: ${theme.spacing(2)};
  `,
  tagSection: css`
    margin-bottom: ${theme.spacing(2)};
  `,
  tagInput: css`
    display: flex;
    gap: ${theme.spacing(1)};
    margin-bottom: ${theme.spacing(1)};
  `,
  tags: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.spacing(1)};
  `,
  tag: css`
    background: ${theme.colors.background.secondary};
    border: 1px solid ${theme.colors.border.medium};
    border-radius: ${theme.shape.borderRadius()};
    padding: ${theme.spacing(0.5)} ${theme.spacing(1)};
    font-size: ${theme.typography.size.sm};
    cursor: pointer;
    &:hover {
      background: ${theme.colors.background.primary};
    }
  `,
  formActions: css`
    display: flex;
    gap: ${theme.spacing(1)};
    justify-content: flex-end;
  `,
  searchesList: css`
    max-height: 400px;
    overflow-y: auto;
  `,
  searchItem: css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: ${theme.spacing(2)};
    border: 1px solid ${theme.colors.border.medium};
    border-radius: ${theme.shape.borderRadius()};
    margin-bottom: ${theme.spacing(1)};
    background: ${theme.colors.background.secondary};
  `,
  searchInfo: css`
    flex: 1;
    h5 {
      margin: 0 0 ${theme.spacing(1)} 0;
    }
    p {
      margin: 0 0 ${theme.spacing(1)} 0;
      color: ${theme.colors.text.secondary};
    }
  `,
  searchMeta: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(0.5)};
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.text.secondary};
  `,
  searchActions: css`
    display: flex;
    gap: ${theme.spacing(1)};
    align-items: center;
  `,
  empty: css`
    text-align: center;
    padding: ${theme.spacing(4)};
    color: ${theme.colors.text.secondary};
  `,
});
