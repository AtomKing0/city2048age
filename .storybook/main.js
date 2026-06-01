import path from 'path';

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-onboarding',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // Inherit vite.config.js path aliases so @config, @prefabs etc. resolve
  async viteFinal(config) {
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@scenes':  path.resolve(__dirname, '../src/scenes'),
      '@prefabs': path.resolve(__dirname, '../src/prefabs'),
      '@systems': path.resolve(__dirname, '../src/systems'),
      '@config':  path.resolve(__dirname, '../src/config'),
      '@styles':  path.resolve(__dirname, '../src/styles'),
    };
    return config;
  },
};

export default config;
