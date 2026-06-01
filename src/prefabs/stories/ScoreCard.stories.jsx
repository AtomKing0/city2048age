import { ScoreCard } from '../ui.jsx';

export default {
  title: 'Prefabs/HUD/ScoreCard',
  component: ScoreCard,
  parameters: {
    backgrounds: { default: 'game', values: [{ name: 'game', value: '#7CB7E8' }] },
  },
};

export const Score = { args: { label: 'SCORE', value: 3200 } };
export const Best  = { args: { label: 'BEST', value: 8192, variant: 'gold' } };
export const Zero  = { args: { label: 'SCORE', value: 0 } };
