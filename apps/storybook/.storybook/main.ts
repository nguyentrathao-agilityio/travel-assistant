import path from 'path';
import type { StorybookConfig } from '@storybook/react-vite';

const webSrc = path.resolve(__dirname, '../../web/src');

const config: StorybookConfig = {
  stories: [
    '../../web/src/**/*.stories.@(ts|tsx)',
    '../../web/src/**/*.mdx',
    '../src/**/*.stories.@(ts|tsx)',
    '../src/**/*.mdx',
  ],

  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions', '@storybook/addon-a11y'],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  docs: {
    autodocs: 'tag',
  },

  viteFinal: async (config) => {
    const { default: tailwindcss } = await import('@tailwindcss/vite');

    config.plugins = [...(config.plugins ?? []), tailwindcss()];
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': webSrc,
    };

    config.resolve.dedupe = ['react', 'react-dom'];

    // Files from apps/web are served via Vite's @fs prefix (outside the
    // Storybook root), so @vitejs/plugin-react's Babel transform may not
    // cover them. Configuring esbuild's jsx mode to 'automatic' ensures
    // those files compile with the React 17+ runtime (no React in scope needed).
    config.esbuild = {
      ...(config.esbuild ?? {}),
      jsx: 'automatic',
      jsxImportSource: 'react',
    };

    return config;
  },
};

export default config;
