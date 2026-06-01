import { GameOverPopup } from '../ui.jsx';

export default {
  title: 'Prefabs/Modals/GameOverPopup',
  component: GameOverPopup,
  parameters: {
    backgrounds: { default: 'overlay', values: [{ name: 'overlay', value: 'rgba(0,0,0,0.6)' }] },
  },
  args: {
    onRestart: () => console.log('restart'),
    onContinue: () => console.log('continue'),
  },
};

export const NewRecord  = { args: { score: 8192,  highScore: 4096 } };
export const SameRecord = { args: { score: 3200,  highScore: 8192 } };
export const FirstGame  = { args: { score: 512,   highScore: 512  } };
