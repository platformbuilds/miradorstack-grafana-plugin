# Miradorstack Grafana Plugin Architecture Plan

## Overview
Create a comprehensive Grafana plugin that brings a user-friendly interface to Grafana, with Mirador Core as the backend data source.

## Plugin Structure

### 1. App Plugin: "Mirador Explorer" 
**Purpose**: Main orchestration plugin providing Kibana-like experience
**Components**:
- Custom pages for data exploration
- Navigation integration
- Configuration management
- UI state management

### 2. Data Source Plugin: "Mirador Core Connector"
**Purpose**: Backend connectivity to Mirador Core APIs
**Features**:
- Metrics query support (PromQL & MetricsQL)
- Logs query builder (Lucene)
- Traces data integration (Lucene)
- AI engine connectivity
- Real-time WebSocket streams
- Schema definition caching

### 3. Panel Plugins Collection
**Purpose**: Specialized visualizations mimicking Kibana's interface patterns

#### 3.1 "Discover Panel"
- Log exploration interface
- Field-based filtering
- Time-based navigation
- Export capabilities

#### 3.2 "Field Stats Panel" 
- Field value distribution
- Top values analysis
- Data type visualization

#### 3.3 "AI Insights Panel"
- RCA investigation results
- Prediction results display (future feature. Not now.)
- Alert correlation views

#### 3.4 "Schema Explorer Panel"
- Metric definitions viewer
- Log field schema browser
- Trace service/operation explorer
- realtime ServiceMaps using the serviceconnector metrics

## Technical Implementation Plan

### Phase 1: Foundation (Weeks 1-2)
1. **Scaffold Plugin Structure**
   ```bash
   npx @grafana/create-plugin@latest
   # Select: App plugin with data source
   ```

2. **Set up Mirador Core Data Source**
   - Authentication handling (LDAP/OAuth)
   - API client setup
   - Connection testing
   - Error handling

3. **Basic UI Framework**
   - React components structure
   - Grafana UI component integration
   - Routing setup for custom pages

### Phase 2: Core Data Access (Weeks 3-4)
1. **Query Builder Implementation**
   - MetricsQL query editor
   - LogsQL pipe-based query builder
   - Query validation
   - Query history

2. **Data Fetching Layer**
   - REST API integration
   - WebSocket stream handling
   - Caching mechanism
   - Pagination support

### Phase 3: Kibana-like UI Components (Weeks 5-7)
1. **Discover Interface**
   - Time range picker integration
   - Field list with statistics
   - Document table view
   - Search bar with suggestions
   - Filters panel

2. **Field Interaction**
   - Click-to-filter functionality
   - Field value aggregation
   - Quick value analysis
   - Field type detection

### Phase 4: Advanced Features (Weeks 8-10)
1. **AI Integration**
   - Prediction analysis display
   - RCA investigation interface
   - Alert correlation views
   - Anomaly highlighting

2. **Schema Management**
   - Schema definition browser
   - Metric/log field documentation
   - Schema search functionality
   - Definition editing (if permissions allow)

### Phase 5: Polish & Performance (Weeks 11-12)
1. **Performance Optimization**
   - Query result caching
   - Virtual scrolling for large datasets
   - Efficient re-rendering
   - Memory usage optimization

2. **User Experience**
   - Loading states
   - Error handling
   - Keyboard shortcuts
   - Export functionality

## Key Components Architecture

### Data Source Configuration
```typescript
interface MiradorDataSourceConfig {
  url: string;
  authType: 'ldap' | 'oauth' | 'token';
  credentials: {
    username?: string;
    password?: string;
    token?: string;
  };
  endpoints: {
    metrics: string;
    logs: string;
    traces: string;
    predict: string;
    rca: string;
    alerts: string;
  };
  websocket: {
    enabled: boolean;
    url: string;
  };
  cache: {
    ttl: number;
    maxSize: number;
  };
}
```

### Query Interface
```typescript
interface MiradorQuery {
  queryType: 'metrics' | 'logs' | 'traces' | 'ai';
  target: string;
  timeRange: TimeRange;
  filters: Filter[];
  aggregations?: Aggregation[];
  limit?: number;
  offset?: number;
}

interface LogsQuery extends MiradorQuery {
  queryType: 'logs';
  logsQL: string;
  fields: string[];
  sort: SortOption[];
}

interface MetricsQuery extends MiradorQuery {
  queryType: 'metrics';
  metricsQL: string;
  step?: string;
}
```

### UI State Management
```typescript
```

## File Structure
```
miradorstack-plugin/
├── src/
│   ├── datasource/
│   │   ├── MiradorDataSource.ts
│   │   ├── ConfigEditor.tsx
│   │   ├── QueryEditor.tsx
│   │   └── api/
│   │       ├── MiradorClient.ts
│   │       ├── MetricsAPI.ts
│   │       ├── LogsAPI.ts
│   │       └── TracesAPI.ts
│   ├── panels/
│   │   ├── discover/
│   │   │   ├── DiscoverPanel.tsx
│   │   │   ├── FieldsList.tsx
│   │   │   ├── DocumentTable.tsx
│   │   │   └── FiltersBar.tsx
│   │   ├── fieldstats/
│   │   └── aiinsights/
│   ├── pages/
│   │   ├── ExplorerPage.tsx
│   │   ├── SchemaPage.tsx
│   │   └── SettingsPage.tsx
│   ├── components/
│   │   ├── QueryBuilder/
│   │   ├── FieldExplorer/
│   │   └── DataViewer/
│   └── utils/
│       ├── queryHelpers.ts
│       ├── fieldUtils.ts
│       └── formatters.ts
```

## Integration Points with Mirador Core

### 1. Authentication Flow
```typescript
// Handle multiple auth types
const authHandler = {
  ldap: (username, password) => POST('/api/v1/auth/login'),
  oauth: (token) => headers['Authorization'] = `Bearer ${token}`,
  token: (apiKey) => headers['X-API-Key'] = apiKey
};
```

### 2. Query Execution
```typescript
// MetricsQL queries
POST /api/v1/query
POST /api/v1/query_range

// Lucene queries for logs
POST /api/v1/logs/query
POST /api/v1/logs/search
// Example: { "query": "level:ERROR AND service:payment", "time_range": {...} }

// Lucene queries for traces
POST /api/v1/traces/search
// Example: { "query": "service:payment AND operation:process_payment", "time_range": {...} }

// AI Analysis
POST /api/v1/predict/analyze
POST /api/v1/rca/investigate
```

### 3. Schema Integration
```typescript
// Fetch schema definitions
GET /api/v1/schema/metrics/{metric}
GET /api/v1/schema/logs/fields/{field}
GET /api/v1/schema/traces/services/{service}
```

### 4. Real-time Updates
```typescript
// WebSocket connection for live data
const wsClient = new WebSocket(miradorConfig.websocket.url);
wsClient.on('metrics', handleMetricsUpdate);
wsClient.on('alerts', handleAlertsUpdate);
```

## User Experience Goals

### Kibana-like Features to Implement:
1. **Discover Interface**
   - Field list on left sidebar
   - Document view in center
   - Time histogram on top
   - Quick filters

2. **Interactive Field Exploration**
   - Click field names to see value distribution
   - Click values to add/remove filters
   - Field statistics overlay

3. **Query Building**
   - Visual query builder
   - Syntax highlighting
   - Auto-completion
   - Query history

4. **Data Export**
   - CSV export
   - JSON export
   - Saved searches

### Grafana Integration Benefits:
1. **Dashboard Integration**
   - Use discovery results in dashboards
   - Create panels from explore queries

2. **Multi-tenancy**
   - Leverage Grafana's org model
   - User permissions
   - Data source isolation

3. **Extensibility**
   - Plugin ecosystem integration
   - Custom visualizations
   - Third-party integrations

## Development Milestones

### Milestone 1: MVP (Week 4)
- Basic data source connectivity
- Simple log query interface
- Field list display
- Document table view

### Milestone 2: Core Features (Week 8)
- Complete discover interface
- Field statistics
- Filter management
- Time range integration
- RCA Investigation

### Milestone 3: Advanced Features (Week 12)
- AI insights integration
- Schema browser
- Real-time updates
- Export functionality

## Success Metrics
- Query response time < 2s for typical log queries
- Support for 10,000+ log entries per query
- Smooth field filtering experience
- Successful AI insight integration
- Schema definition coverage > 80%

## Technical Challenges & Solutions

### Challenge 1: Performance with Large Log Datasets
**Solution**: Implement virtual scrolling, pagination, and efficient caching

### Challenge 2: Complex LogsQL Query Building
**Solution**: Create visual query builder with pipe-based logic

### Challenge 3: Real-time Data Integration
**Solution**: Use WebSocket connections with efficient state management

### Challenge 4: Schema Definition Management
**Solution**: Cache schema data and provide search functionality

### Challenge 5: AI Feature Integration
**Solution**: Create dedicated panels for prediction/RCA results

This architecture provides a solid foundation for creating a Grafana plugin that brings user-friendly experience to the Grafana ecosystem while leveraging `mirador-core` advanced observability capabilities.
