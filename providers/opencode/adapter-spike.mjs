#!/usr/bin/env node

/**
 * DPT-PROVIDER-004.B — Minimal OpenCode Adapter Control Spike
 *
 * Demonstrates: DPT → OpenCode Provider Adapter → SDK → OpenCode → structured result
 *
 * Proof task: Read a known repository-local file and return a deterministic result.
 * No code modification, no config change, no commit/push/merge/deploy.
 */

import { createOpencode } from "@opencode-ai/sdk";

const PROOF_FILE = "README.md";

function normalizeResult(fields) {
  return {
    task_id: fields.task_id,
    work_order_id: fields.work_order_id ?? null,
    provider_adapter: "dpt-opencode-provider-adapter",
    control_surface: "SDK",
    session_id: fields.session_id ?? null,
    agent: fields.agent ?? null,
    provider: fields.provider ?? null,
    model: fields.model ?? null,
    attempt: 1,
    started_at: fields.started_at,
    completed_at: fields.completed_at,
    duration_ms: fields.duration_ms,
    status: fields.status,
    exit_class: fields.exit_class,
    raw_result_reference: null,
    structured_result: fields.raw_result ?? null,
    evidence: fields.evidence,
  };
}

async function main() {
  const started_at = new Date().toISOString();
  const t0 = Date.now();
  let instance = null;

  try {
    console.error("[adapter] Starting OpenCode via SDK...");
    instance = await createOpencode({
      hostname: "127.0.0.1",
      port: 0,
      timeout: 15000,
    });
    const client = instance.client;
    const server = instance.server;
    console.error(`[adapter] Server running at ${server.url}`);

    console.error("[adapter] Creating session...");
    const session = await client.session.create({ body: {} });
    const session_id = session.data.id;
    console.error(`[adapter] Session created: ${session_id}`);

    const work_order_id = `DPT-WO-PROOF-${Date.now()}`;
    const prompt_text = [
      `Work Order: ${work_order_id}`,
      `Task: Read the file "${PROOF_FILE}" from the repository root and return a JSON result.`,
      `Required output format (return exactly this JSON, no other text):`,
      `{`,
      `  "proof": "OPEN_CODE_ADAPTER_CONTROL",`,
      `  "status": "PASS",`,
      `  "file": "${PROOF_FILE}",`,
      `  "first_line": "<first line of the file>",`,
      `  "work_order_id": "${work_order_id}"`,
      `}`,
      `Do NOT modify any files. Do NOT run any commands. Only read the file and return the JSON.`,
    ].join("\n");

    console.error("[adapter] Sending Work Order prompt...");
    const response = await client.session.prompt({
      path: { id: session_id },
      body: { parts: [{ type: "text", text: prompt_text }] },
    });

    const completed_at = new Date().toISOString();
    const duration_ms = Date.now() - t0;

    const assistant_msg = response.data;
    let raw_result = null;
    let status = "UNKNOWN";
    let exit_class = "UNKNOWN";

    if (assistant_msg?.parts) {
      for (const part of assistant_msg.parts) {
        if (part.type === "text" && part.text) {
          const json_match = part.text.match(/\{[\s\S]*"proof"[\s\S]*\}/);
          if (json_match) {
            try {
              raw_result = JSON.parse(json_match[0]);
              status = raw_result.status === "PASS" ? "SUCCESS" : "INVALID_RESULT";
              exit_class = status === "SUCCESS" ? "SUCCESS" : "INVALID_RESULT";
            } catch {
              raw_result = { raw_text: part.text };
              status = "INVALID_RESULT";
              exit_class = "INVALID_RESULT";
            }
          } else {
            raw_result = { raw_text: part.text };
            status = "INVALID_RESULT";
            exit_class = "INVALID_RESULT";
          }
        }
      }
    }

    if (status === "UNKNOWN") {
      status = "INVALID_RESULT";
      exit_class = "INVALID_RESULT";
    }

    let provider = null;
    let model = null;
    try {
      const config = await client.config.get();
      if (config.data) {
        model = config.data.model ?? null;
      }
    } catch {}

    const result = normalizeResult({
      task_id: "DPT-PROVIDER-004B-PROOF",
      work_order_id,
      session_id,
      status,
      exit_class,
      started_at,
      completed_at,
      duration_ms,
      raw_result,
      evidence: {
        sdk_used: true,
        server_url: server.url,
        session_created: true,
        prompt_sent: true,
        response_received: true,
      },
    });

    console.log(JSON.stringify(result, null, 2));

    if (server) server.close();
    process.exit(0);
  } catch (err) {
    const completed_at = new Date().toISOString();
    const duration_ms = Date.now() - t0;

    let exit_class = "UNKNOWN";
    const msg = err?.message ?? String(err);
    if (msg.includes("timeout")) exit_class = "TIMEOUT";
    else if (msg.includes("ECONNREFUSED") || msg.includes("fetch")) exit_class = "CONTROL_SURFACE_FAILURE";
    else if (msg.includes("auth") || msg.includes("401")) exit_class = "AUTH_FAILURE";
    else if (msg.includes("429")) exit_class = "RATE_LIMIT";
    else exit_class = "PROVIDER_FAILURE";

    const result = normalizeResult({
      task_id: "DPT-PROVIDER-004B-PROOF",
      status: "FAIL",
      exit_class,
      started_at,
      completed_at,
      duration_ms,
      raw_result: null,
      evidence: { error: msg, stack: err?.stack ?? null },
    });

    console.log(JSON.stringify(result, null, 2));

    if (instance?.server) {
      try { instance.server.close(); } catch {}
    }
    process.exit(1);
  }
}

main();
