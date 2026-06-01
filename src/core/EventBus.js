// Unity SendMessage analogue — lightweight typed pub/sub
const _listeners = {};

export const EventBus = {
  on(event, fn) {
    (_listeners[event] ??= new Set()).add(fn);
    return () => this.off(event, fn); // returns unsubscribe fn
  },

  off(event, fn) {
    _listeners[event]?.delete(fn);
  },

  emit(event, data) {
    _listeners[event]?.forEach(fn => fn(data));
  },

  // Remove all listeners for an event (useful on scene unload)
  clear(event) {
    delete _listeners[event];
  },
};
