// Typed event name constants — prevents typo bugs (Unity string message analogue)
export const GAME_EVENTS = {
  // Board
  MERGE:        'game:merge',        // { level, count, scoreGained }
  MOVE:         'game:move',         // { direction }
  GAME_OVER:    'game:gameOver',     // { score, best }

  // Economy
  SCORE_UP:     'game:scoreUp',      // { delta, total }
  COIN_EARN:    'game:coinEarn',     // { amount, reason }
  COIN_SPEND:   'game:coinSpend',    // { amount, reason }

  // Progression
  AGE_CHANGE:   'game:ageChange',    // { ageId, prev }
  AGE_UNLOCK:   'game:ageUnlock',    // { ageId }

  // Boosters
  BOOSTER_USE:  'game:boosterUse',   // { type: 'undo'|'wand'|'cleaner' }

  // Session
  GAME_START:   'game:start',        // { ageId }
  GAME_RESTART: 'game:restart',      // {}
  AD_WATCH:     'game:adWatch',      // { reward }
};
