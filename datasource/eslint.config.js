import grafanaConfig from '@grafana/eslint-config/flat.js';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*'],
  },
  ...grafanaConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-deprecated': 'warn',
      'react/prop-types': 'off',
    },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },
];
