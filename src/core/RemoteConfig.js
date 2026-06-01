// Live-ops remote config — fetches overrides from CDN/API, falls back to local balance.json
// Usage: await RemoteConfig.fetch('https://cdn.example.com/config.json')
//        RemoteConfig.get('animDuration', 0.13)
import localBalance from '../config/balance.json';

export const RemoteConfig = {
  _config: { ...localBalance },

  // Call once at app start — silently falls back to local on any error
  async fetch(url) {
    if (!url) return;
    try {
      const res = await globalThis.fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const remote = await res.json();
      // Remote values override local; unspecified keys keep local defaults
      this._config = { ...localBalance, ...remote };
      console.log('[RemoteConfig] loaded remote config');
    } catch (e) {
      console.warn('[RemoteConfig] fallback to local config:', e.message);
    }
  },

  get(key, fallback) {
    return key in this._config ? this._config[key] : fallback;
  },

  // Convenience — returns full resolved config snapshot
  all() {
    return { ...this._config };
  },
};
