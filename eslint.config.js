/**
 * @file Flat ESLint config for the whole PixelForge repo.
 *
 * Two source worlds with different globals/module systems:
 *   - `frontend/js/**` — browser ES modules (import/export, `window`, `document`).
 *   - `backend/**`      — Node CommonJS (`require`, `module`, `process`).
 *
 * Rules are sensible, not draconian (a student POC), and Prettier owns all
 * formatting: `eslint-config-prettier` is applied last so no stylistic rule
 * fights the formatter.
 *
 * Dependencies live in `backend/node_modules`; we resolve them through a
 * require anchored there so `npm run lint` works from the backend dir (or root).
 */

'use strict';

const { createRequire } = require('node:module');
const path = require('node:path');

// Anchor module resolution at backend/ where eslint + plugins are installed,
// regardless of where eslint is launched from.
const backendRequire = createRequire(path.join(__dirname, 'backend', 'package.json'));
const js = backendRequire('@eslint/js');
const globals = backendRequire('globals');
const prettier = backendRequire('eslint-config-prettier');

/** Rules shared by every JS file in the repo. */
const sharedRules = {
  ...js.configs.recommended.rules,
  // Allow intentionally unused args when prefixed with `_` (e.g. Express
  // error-handler `(err, _req, res, _next)`), and ignore rest-siblings.
  'no-unused-vars': [
    'warn',
    { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
  ],
  // `console` is the app's logger here; permit it everywhere.
  'no-console': 'off',
  eqeqeq: ['warn', 'smart'],
  'prefer-const': 'warn',
  'no-var': 'error',
};

module.exports = [
  // -------------------------------------------------------------------------
  // Ignore generated / vendored / non-authored paths.
  // -------------------------------------------------------------------------
  {
    ignores: [
      '**/node_modules/**',
      'coverage/**',
      'dist/**',
      // Static design mockups & prototypes are not linted.
      'frontend/design/**',
      // Plain config files served to the browser without a build step.
      '**/*.min.js',
    ],
  },

  // -------------------------------------------------------------------------
  // Frontend — browser ES modules.
  // -------------------------------------------------------------------------
  {
    files: ['frontend/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: sharedRules,
  },

  // -------------------------------------------------------------------------
  // Backend — Node CommonJS.
  // -------------------------------------------------------------------------
  {
    files: ['backend/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: sharedRules,
  },

  // -------------------------------------------------------------------------
  // Backend tests — Node test runner globals (test/it/describe via node:test
  // are imported, but allow the broader Node + test env to be safe).
  // -------------------------------------------------------------------------
  {
    files: ['backend/test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      ...sharedRules,
      // Tests often assign throwaways; keep it quiet there.
      'no-unused-vars': 'off',
    },
  },

  // -------------------------------------------------------------------------
  // This config file itself is CommonJS run by Node.
  // -------------------------------------------------------------------------
  {
    files: ['eslint.config.js'],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } },
    rules: sharedRules,
  },

  // -------------------------------------------------------------------------
  // Prettier compatibility — MUST be last: disables every stylistic rule that
  // would clash with the formatter.
  // -------------------------------------------------------------------------
  prettier,
];
