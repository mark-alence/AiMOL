// ============================================================
// events.js — Standalone event bus for PDB Viewer
// ============================================================

export const ViewerEvents = {
  _listeners: {},
  on(event, fn)  { (this._listeners[event] ||= []).push(fn); },
  off(event, fn) { this._listeners[event] = (this._listeners[event] || []).filter(f => f !== fn); },
  emit(event, data) { (this._listeners[event] || []).forEach(fn => fn(data)); },
};
