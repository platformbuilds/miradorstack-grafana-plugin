import React from 'react';
import { JSONFormatter, Badge, Stack } from '@grafana/ui';
import type { LogDocument } from '../../types/discover';

interface DocumentRowDetailsProps {
  document: LogDocument;
}

export const DocumentRowDetails: React.FC<DocumentRowDetailsProps> = ({ document }) => {
  return (
    <Stack direction="column" gap={1} data-testid={`document-details-${document.id}`}>
      <Stack direction="row" gap={1} wrap>
        {document.traceId && <Badge text={`Trace ${document.traceId}`} color="blue" />}
        {document.spanId && <Badge text={`Span ${document.spanId}`} color="blue" />}
        {document.tenant && <Badge text={`Tenant ${document.tenant}`} color="blue" />}
      </Stack>
      <JSONFormatter json={document.attributes} open={1} />
    </Stack>
  );
};
