// eslint config

'use strict';

const { createRequire } = require('node:module' );
const path = require('node:path' );

// deps
const backendRequire = createRequire( path.join(__dirname, 'backend', 'package.json') );
const js = backendRequire('@eslint/js');
const globals = backendRequire('globals');
const prettier = backendRequire('eslint-config-prettier');

// shared rules
const sharedRules = {
  ...js.configs.recommended.rules,
  'no-unused-vars': [
    'warn',
    { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
  ],
  'no-console': 'off',
  eqeqeq: ['warn', 'smart'],
  'prefer-const': 'warn',
  'no-var': 'error',
};

module.exports = [
  // ignores
  {
    ignores: [
      '**/node_modules/**',
      'coverage/**',
      'dist/**',
      'frontend/design/**',
      '**/*.min.js',
     ],
  },

  // frontend
  {
    files: ['frontend/js/**/*.js' ],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: sharedRules,
  },

  // backend
  {
    files: ['backend/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node },
     },
    rules: sharedRules,
   },

  // backend tests
  {
    files: ['backend/test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: {  ...globals.node },
    },
    rules: {
      ...sharedRules,
      'no-unused-vars': 'off',
    },
  },

  // this config file
  {
    files: ['eslint.config.js'],
    languageOptions: {  sourceType: 'commonjs', globals: { ...globals.node }  },
    rules: sharedRules,
  },

  // prettier
  prettier,
];
