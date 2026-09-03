/**
 * DPT-PROVIDER-004.E — Event Bridge
 *
 * Correlates, deduplicates, orders, and persists DPT events + evidence.
 * Handles restart/rehydration continuity.
 */

import { eventHash, evidenceHash, createEvent, EVENT_TYPE } from "./event-model.mjs";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

let _bridge_seq = 0;

/**
 * EventBridge — manages event/evidence correlation, dedup, ordering, persistence.
 */
export class EventBridge {
  constructor({ task_id, work_order_id, state_dir }) {
    this.task_id = task_id;
    this.work_order_id = work_order_id;
    this.state_dir = state_dir;
    this.events = [];
    this.evidence = [];
    this.seen_event_hashes = new Set();
    this.seen_evidence_hashes = new Set();
    this.sequence = 0;
    this.completion_emitted = false;
  }

  /**
   * Ingest events + evidence from normalizer output.
   * Returns { events_added, evidence_added, duplicates_skipped }.
   */
  ingest({ events, evidence } = {}) {
    const evts = Array.isArray(events) ? events : [];
    const evds = Array.isArray(evidence) ? evidence : [];
    let events_added = 0;
    let evidence_added = 0;
    let duplicates_skipped = 0;

    for (const evt of evts) {
      const hash = eventHash(evt);
      if (this.seen_event_hashes.has(hash)) {
        duplicates_skipped++;
        continue;
      }
      this.seen_event_hashes.add(hash);
      this.events.push({ ...evt, _dpt_sequence: ++this.sequence });
      events_added++;
    }

    for (const evd of evds) {
      const hash = evidenceHash(evd);
      if (this.seen_evidence_hashes.has(hash)) {
        duplicates_skipped++;
        continue;
      }
      this.seen_evidence_hashes.add(hash);
      this.evidence.push(evd);
      evidence_added++;
    }

    return { events_added, evidence_added, duplicates_skipped };
  }

  /**
   * Emit a completion event (idempotent — only once).
   */
  emitCompletion({ status = "PASS", result_summary = null } = {}) {
    if (this.completion_emitted) {
      return { emitted: false, reason: "already_emitted" };
    }

    const evt = createEvent({
      event_type: EVENT_TYPE.WORK_ORDER_COMPLETED,
      task_id: this.task_id,
      work_order_id: this.work_order_id,
      execution_phase: "COMPLETE",
      status,
      normalized_payload: { result_summary },
    });

    this.events.push({ ...evt, _dpt_sequence: ++this.sequence });
    this.completion_emitted = true;
    return { emitted: true, event: evt };
  }

  /**
   * Get ordered events.
   */
  getEvents() {
    return [...this.events].sort((a, b) => a._dpt_sequence - b._dpt_sequence);
  }

  /**
   * Get evidence.
   */
  getEvidence() {
    return [...this.evidence];
  }

  /**
   * Reconstruct execution from durable records.
   */
  reconstruct() {
    const ordered_events = this.getEvents();
    return {
      task_id: this.task_id,
      work_order_id: this.work_order_id,
      total_events: ordered_events.length,
      total_evidence: this.evidence.length,
      event_types: [...new Set(ordered_events.map(e => e.event_type))],
      evidence_types: [...new Set(this.evidence.map(e => e.evidence_type))],
      tool_calls: ordered_events
        .filter(e => e.event_type === "TOOL_COMPLETED" || e.event_type === "TOOL_REQUESTED")
        .map(e => ({
          tool: e.normalized_payload?.tool_name,
          state: e.normalized_payload?.tool_state,
        })),
      provider_sessions: [...new Set(ordered_events.map(e => e.provider_session_id).filter(Boolean))],
      has_failure: ordered_events.some(e => e.event_type === "FAILURE_OBSERVED"),
      has_completion: ordered_events.some(e => e.event_type === "WORK_ORDER_COMPLETED"),
      recovery_generations: [...new Set(ordered_events.map(e => e.recovery_generation))],
    };
  }

  /**
   * Persist to disk.
   */
  persist() {
    if (!existsSync(this.state_dir)) {
      mkdirSync(this.state_dir, { recursive: true });
    }

    const data = {
      task_id: this.task_id,
      work_order_id: this.work_order_id,
      sequence: this.sequence,
      completion_emitted: this.completion_emitted,
      events: this.events,
      evidence: this.evidence,
      seen_event_hashes: [...this.seen_event_hashes],
      seen_evidence_hashes: [...this.seen_evidence_hashes],
    };

    const filepath = join(this.state_dir, `events-${this.task_id}-${this.work_order_id}.json`);
    writeFileSync(filepath, JSON.stringify(data, null, 2));
    return filepath;
  }

  /**
   * Load from disk.
   */
  static load(filepath) {
    if (!existsSync(filepath)) return null;
    const data = JSON.parse(readFileSync(filepath, "utf-8"));
    const bridge = new EventBridge({
      task_id: data.task_id,
      work_order_id: data.work_order_id,
      state_dir: join(filepath, ".."),
    });
    bridge.events = data.events ?? [];
    bridge.evidence = data.evidence ?? [];
    bridge.sequence = data.sequence ?? 0;
    bridge.completion_emitted = data.completion_emitted ?? false;
    bridge.seen_event_hashes = new Set(data.seen_event_hashes ?? []);
    bridge.seen_evidence_hashes = new Set(data.seen_evidence_hashes ?? []);
    return bridge;
  }
}
