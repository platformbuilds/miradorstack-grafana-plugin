# 1. Create the main app plugin
npx @grafana/create-plugin@latest

# When prompted, choose:
# - Plugin type: App
# - Plugin name: mirador-kibana-explorer
# - Organization: your-org
# - Add backend: Yes
# - Add components: Yes

cd your-org-mirador-kibana-explorer-app

# 2. Install additional dependencies for our use case
npm install --save \
  @types/lodash \
  lodash \
  react-window \
  react-window-infinite-loader \
  fuse.js \
  date-fns

# 3. Install development dependencies
npm install --save-dev \
  @types/react-window \
  @types/react-window-infinite-loader

# 4. Set up project structure
mkdir -p src/datasource
mkdir -p src/panels/discover
mkdir -p src/panels/fieldstats  
mkdir -p src/panels/aiinsights
mkdir -p src/pages
mkdir -p src/components/QueryBuilder
mkdir -p src/components/FieldExplorer
mkdir -p src/components/DataViewer
mkdir -p src/utils
mkdir -p src/types

# 5. Generate the data source plugin separately
cd ../
npx @grafana/create-plugin@latest

# When prompted, choose:
# - Plugin type: Data source  
# - Plugin name: mirador-core-datasource
# - Organization: your-org
# - Add backend: Yes

# 6. Development workflow
cd your-org-mirador-kibana-explorer-app

# Install dependencies
npm install

# Start development server
npm run dev

# In another terminal, build backend (if needed)
mage -v build:backend

# Start Grafana with Docker
docker compose up
