/**
 * DPT-FOUNDATION-025 — Persistent Project Memory (V1 Runtime)
 * Bounded to TASKS.md durable store per ADR-027. JSON records with TTL.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
export class MemoryRuntime {
  constructor({ storePath = '.dpt/memory.json' } = {}) { this.storePath = storePath; this._load(); }
  _load() {
    if (existsSync(this.storePath)) {
      try {
        const data = JSON.parse(readFileSync(this.storePath, 'utf8'));
        this.store = { records: new Map(data.records || []) };
      } catch { this.store = { records: new Map() }; }
    } else {
      this.store = { records: new Map(), version: 'v1' };
    }
  }
  _persist() {
    const d = dirname(this.storePath); if (d && !existsSync(d)) mkdirSync(d, { recursive: true });
    writeFileSync(this.storePath, JSON.stringify({ version: 'v1', records: Array.from(this.store.records.entries()) }, null, 2), 'utf8');
  }
  async put(key, value, ttl) {
    const record = { key, value, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), expires_at: ttl ? new Date(Date.now() + ttl).toISOString() : null };
    this.store.records.set(key, record); this._persist(); return { written: true, key };
  }
  async get(key) {
    const r = this.store.records.get(key); if (!r) return null;
    if (r.expires_at && new Date(r.expires_at) < new Date()) { this.store.records.delete(key); this._persist(); return null; }
    return r.value;
  }
  async has(key) { return (await this.get(key)) !== null; }
  async delete(key) { if (!this.store.records.has(key)) return false; this.store.records.delete(key); this._persist(); return true; }
  async keys() { return Array.from(this.store.records.keys()); }
  async clear() { this.store.records.clear(); this._persist(); return { cleared: true }; }
}
export function createMemoryRuntime(c) { return new MemoryRuntime(c); }
