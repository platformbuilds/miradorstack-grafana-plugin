import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Set up testing library configuration
configure({ testIdAttribute: 'data-testid' });

// Mock Grafana modules
jest.mock('@grafana/runtime', () => ({
  getBackendSrv: jest.fn(),
  config: {
    theme2: {},
  },
}));

// Set up global mocks
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));