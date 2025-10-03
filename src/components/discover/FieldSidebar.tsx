import React, { useState, useMemo, useCallback, memo } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Input, Button, Icon, CollapsableSection } from '@grafana/ui';

export interface FieldInfo {
  name: string;
  type: string;
  count: number;
  percentage: number;
  topValues?: Array<{ value: string; count: number; percentage: number }>;
}

interface FieldSidebarProps {
  fields: FieldInfo[];
  selectedFields?: Set<string>;
  onFieldToggle?: (fieldName: string) => void;
  onFieldPin?: (fieldName: string) => void;
  pinnedFields?: Set<string>;
  width?: number;
}

export const FieldSidebar = memo(function FieldSidebar({
  fields,
  selectedFields = new Set(),
  onFieldToggle,
  onFieldPin,
  pinnedFields = new Set(),
  width = 300,
}: FieldSidebarProps) {
  const s = useStyles2(getStyles);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['all']));

  const filteredFields = useMemo(() => {
    if (!searchTerm) {
      return fields;
    }

    return fields.filter(field =>
      field.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [fields, searchTerm]);

  const pinnedFieldsList = filteredFields.filter(field => pinnedFields.has(field.name));
  const unpinnedFieldsList = filteredFields.filter(field => !pinnedFields.has(field.name));

  const toggleSection = useCallback((sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  }, [expandedSections]);

  const handleFieldToggle = useCallback((fieldName: string) => {
    onFieldToggle?.(fieldName);
  }, [onFieldToggle]);

  const handleFieldPin = useCallback((fieldName: string) => {
    onFieldPin?.(fieldName);
  }, [onFieldPin]);

  const handleFieldClick = useCallback((fieldName: string) => {
    onFieldToggle?.(fieldName);
  }, [onFieldToggle]);

  const handlePinClick = useCallback((fieldName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onFieldPin?.(fieldName);
  }, [onFieldPin]);

  return (
    <div className={s.container} style={{ width }}>
      <div className={s.header}>
        <h4 className={s.title}>Fields</h4>
        <div className={s.search}>
          <Input
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            prefix={<Icon name="search" />}
            width={20}
          />
        </div>
      </div>

      <div className={s.content}>
        {/* Pinned Fields Section */}
        {pinnedFieldsList.length > 0 && (
          <CollapsableSection
            label={`Pinned Fields (${pinnedFieldsList.length})`}
            isOpen={expandedSections.has('pinned')}
            onToggle={() => toggleSection('pinned')}
          >
            <div className={s.fieldList}>
              {pinnedFieldsList.map(field => (
                <FieldItem
                  key={field.name}
                  field={field}
                  isSelected={selectedFields.has(field.name)}
                  isPinned={true}
                  onClick={() => handleFieldClick(field.name)}
                  onPin={(e) => handlePinClick(field.name, e)}
                />
              ))}
            </div>
          </CollapsableSection>
        )}

        {/* All Fields Section */}
        <CollapsableSection
          label={`All Fields (${unpinnedFieldsList.length})`}
          isOpen={expandedSections.has('all')}
          onToggle={() => toggleSection('all')}
        >
          <div className={s.fieldList}>
            {unpinnedFieldsList.map(field => (
              <FieldItem
                key={field.name}
                field={field}
                isSelected={selectedFields.has(field.name)}
                isPinned={false}
                onClick={() => handleFieldClick(field.name)}
                onPin={(e) => handlePinClick(field.name, e)}
              />
            ))}
          </div>
        </CollapsableSection>
      </div>
    </div>
  );
});

interface FieldItemProps {
  field: FieldInfo;
  isSelected: boolean;
  isPinned: boolean;
  onClick: () => void;
  onPin: (event: React.MouseEvent) => void;
}

function FieldItem({ field, isSelected, isPinned, onClick, onPin }: FieldItemProps) {
  const s = useStyles2(getFieldItemStyles);

  return (
    <div
      className={s.container(isSelected)}
      onClick={onClick}
    >
      <div className={s.header}>
        <div className={s.name}>
          {field.name}
          <span className={s.type}>({field.type})</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={isPinned ? 'favorite' : 'star'}
          onClick={onPin}
          aria-label={isPinned ? 'Unpin field' : 'Pin field'}
        />
      </div>

      <div className={s.stats}>
        <span className={s.count}>{field.count.toLocaleString()} values</span>
        <span className={s.percentage}>{field.percentage.toFixed(1)}%</span>
      </div>

      {field.topValues && field.topValues.length > 0 && (
        <div className={s.topValues}>
          {field.topValues.slice(0, 3).map((value, index) => (
            <div key={index} className={s.value}>
              <span className={s.valueText} title={value.value}>
                {value.value.length > 20 ? `${value.value.substring(0, 20)}...` : value.value}
              </span>
              <span className={s.valueCount}>{value.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid ${theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
    background: ${theme.colors.background.primary};
  `,
  header: css`
    padding: ${theme.spacing(2)};
    border-bottom: 1px solid ${theme.colors.border.weak};
    background: ${theme.colors.background.secondary};
  `,
  title: css`
    margin: 0 0 ${theme.spacing(2)} 0;
    font-size: ${theme.typography.size.md};
    font-weight: ${theme.typography.fontWeightMedium};
    color: ${theme.colors.text.primary};
  `,
  search: css`
    margin-bottom: ${theme.spacing(1)};
  `,
  content: css`
    flex: 1;
    overflow-y: auto;
    padding: ${theme.spacing(1)};
  `,
  fieldList: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
  `,
});

const getFieldItemStyles = (theme: GrafanaTheme2) => ({
  container: (isSelected: boolean) => css`
    padding: ${theme.spacing(1.5)};
    border: 1px solid ${isSelected ? theme.colors.primary.border : theme.colors.border.weak};
    border-radius: ${theme.shape.radius.default};
    background: ${isSelected ? theme.colors.background.secondary : theme.colors.background.primary};
    cursor: pointer;
    transition: all 0.1s ease;

    &:hover {
      background: ${theme.colors.background.secondary};
      border-color: ${theme.colors.primary.border};
    }
  `,
  header: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${theme.spacing(1)};
  `,
  name: css`
    font-size: ${theme.typography.size.sm};
    font-weight: ${theme.typography.fontWeightMedium};
    color: ${theme.colors.text.primary};
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
  `,
  type: css`
    font-size: ${theme.typography.size.xs};
    color: ${theme.colors.text.secondary};
    font-weight: normal;
  `,
  stats: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${theme.spacing(1)};
  `,
  count: css`
    font-size: ${theme.typography.size.xs};
    color: ${theme.colors.text.secondary};
  `,
  percentage: css`
    font-size: ${theme.typography.size.xs};
    color: ${theme.colors.primary.text};
    font-weight: ${theme.typography.fontWeightMedium};
  `,
  topValues: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(0.5)};
  `,
  value: css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: ${theme.typography.size.xs};
    color: ${theme.colors.text.secondary};
  `,
  valueText: css`
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  valueCount: css`
    margin-left: ${theme.spacing(1)};
    color: ${theme.colors.text.primary};
  `,
});
