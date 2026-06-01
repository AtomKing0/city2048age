// Unity GameManager singleton — central hub for game-wide state & system refs
import { EventBus } from './EventBus.js';
import { GAME_EVENTS } from './GameEvents.js';

export const GameManager = {
  // — State snapshot (read-only mirror of React state) —
  score:    0,
  best:     0,
  coins:    0,
  ageId:    'stone',
  isOver:   false,

  // — System references (set via init) —
  _audio:   null,
  _board:   null,

  // Called once on scene mount
  init({ audio, board }) {
    this._audio = audio;
    this._board = board;
    EventBus.emit(GAME_EVENTS.GAME_START, { ageId: this.ageId });
  },

  // — Emit helpers (call these instead of raw EventBus.emit in game code) —

  onMerge(level, count, scoreGained) {
    EventBus.emit(GAME_EVENTS.MERGE, { level, count, scoreGained });
  },

  onMove(direction) {
    EventBus.emit(GAME_EVENTS.MOVE, { direction });
  },

  onScoreUp(delta, total) {
    this.score = total;
    if (total > this.best) this.best = total;
    EventBus.emit(GAME_EVENTS.SCORE_UP, { delta, total });
  },

  onCoinEarn(amount, reason = 'ad') {
    this.coins += amount;
    EventBus.emit(GAME_EVENTS.COIN_EARN, { amount, reason });
  },

  onCoinSpend(amount, reason = 'booster') {
    this.coins -= amount;
    EventBus.emit(GAME_EVENTS.COIN_SPEND, { amount, reason });
  },

  onAgeChange(ageId) {
    const prev = this.ageId;
    this.ageId = ageId;
    EventBus.emit(GAME_EVENTS.AGE_CHANGE, { ageId, prev });
  },

  onAgeUnlock(ageId) {
    EventBus.emit(GAME_EVENTS.AGE_UNLOCK, { ageId });
  },

  onBoosterUse(type) {
    EventBus.emit(GAME_EVENTS.BOOSTER_USE, { type });
  },

  onGameOver() {
    this.isOver = true;
    EventBus.emit(GAME_EVENTS.GAME_OVER, { score: this.score, best: this.best });
  },

  onRestart() {
    this.score = 0;
    this.isOver = false;
    EventBus.emit(GAME_EVENTS.GAME_RESTART, {});
  },

  onAdWatch(reward) {
    EventBus.emit(GAME_EVENTS.AD_WATCH, { reward });
  },
};
