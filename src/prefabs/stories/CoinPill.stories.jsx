import { CoinPill } from '../ui.jsx';

export default {
  title: 'Prefabs/HUD/CoinPill',
  component: CoinPill,
  parameters: {
    backgrounds: { default: 'game', values: [{ name: 'game', value: '#7CB7E8' }] },
  },
};

export const Default = { args: { coins: 2400 } };
export const Big    = { args: { coins: 9999, big: true } };
export const Zero   = { args: { coins: 0 } };
export const Rich   = { args: { coins: 99999 } };
