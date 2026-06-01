// Analytics stub — auto-wires to GameEvents via EventBus
// Dev: logs to console. Prod: swap track() body for Firebase / Amplitude / Mixpanel.
import { EventBus } from './EventBus.js';
import { GAME_EVENTS } from './GameEvents.js';

const isDev = import.meta.env.DEV;

function track(event, props = {}) {
  if (isDev) {
    console.log(`[Analytics] ${event}`, props);
    return;
  }
  // — Plug in your analytics SDK here —
  // window.gtag?.('event', event, props);
  // window.amplitude?.track(event, props);
  // mixpanel?.track(event, props);
}

// Call once at app start — registers all event listeners automatically
export function initAnalytics() {
  EventBus.on(GAME_EVENTS.GAME_START,   ({ ageId }) =>
    track('game_start', { ageId }));

  EventBus.on(GAME_EVENTS.GAME_RESTART, () =>
    track('game_restart'));

  EventBus.on(GAME_EVENTS.GAME_OVER,    ({ score, best }) =>
    track('game_over', { score, best }));

  EventBus.on(GAME_EVENTS.MERGE,        ({ level, count, scoreGained }) =>
    track('merge', { level, count, scoreGained }));

  EventBus.on(GAME_EVENTS.SCORE_UP,     ({ delta, total }) =>
    track('score_up', { delta, total }));

  EventBus.on(GAME_EVENTS.AGE_CHANGE,   ({ ageId, prev }) =>
    track('age_change', { ageId, prev }));

  EventBus.on(GAME_EVENTS.AGE_UNLOCK,   ({ ageId }) =>
    track('age_unlock', { ageId }));

  EventBus.on(GAME_EVENTS.BOOSTER_USE,  ({ type }) =>
    track('booster_use', { type }));

  EventBus.on(GAME_EVENTS.AD_WATCH,     ({ reward }) =>
    track('ad_watch', { reward }));

  EventBus.on(GAME_EVENTS.COIN_EARN,    ({ amount, reason }) =>
    track('coin_earn', { amount, reason }));

  EventBus.on(GAME_EVENTS.COIN_SPEND,   ({ amount, reason }) =>
    track('coin_spend', { amount, reason }));
}
