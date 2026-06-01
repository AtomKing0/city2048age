import { BoosterBar } from '../ui.jsx';

export default {
  title: 'Prefabs/HUD/BoosterBar',
  component: BoosterBar,
  parameters: {
    backgrounds: { default: 'game', values: [{ name: 'game', value: '#E0CFA8' }] },
  },
  args: {
    canUndo: true,
    removeMode: false,
    wandMode: false,
    undoItems: 3,
    removeItems: 2,
    wandItems: 1,
    onUndo: () => console.log('undo'),
    onWand: () => console.log('wand'),
    onRemove: () => console.log('remove'),
  },
};

export const Default  = {};
export const WandMode = { args: { wandMode: true } };
export const CleanerMode = { args: { removeMode: true } };
export const NoItems  = { args: { undoItems: 0, removeItems: 0, wandItems: 0 } };
