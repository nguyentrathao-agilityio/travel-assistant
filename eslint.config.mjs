/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      '**/.next/**',
      '**/dist/**',
      '**/.mastra/**',
      '**/node_modules/**',
      '**/.turbo/**',
      'commitlint.config.js',
    ],
  },
];
