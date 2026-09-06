#!/usr/bin/env node
/**
 * DPT-FOUNDATION-002 — Goose Extension for Runtime Enforcement
 *
 * Self-contained MCP stdio server with proper message queuing.
 */

import { stdin, stdout } from 'process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { resolve, join, dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';

const _dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(_dirname, '../..');
const STATE_DIR = join(REPO_ROOT, '.dpt-goose-state');
const TEST_DIR = join(REPO_ROOT, '.dpt-goose-acceptance');

for (const d of [STATE_DIR, TEST_DIR]) {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

const adapterModule = await import(resolve(_dirname, './goose-adapter.mjs'));
const envelopeModule = await import(resolve(_dirname, '../opencode/permission-envelope.mjs'));
const contractModule = await import(resolve(_dirname, '../contract/provider-contract.mjs'));

const { createGooseAdapter } = adapterModule;
const { createEnvelope } = envelopeModule;
const { DOMAIN, AUTHORITY_MODE } = contractModule;

const envelope = createEnvelope({
  task_id: 'DPT-FOUNDATION-002',
  work_order_id: 'DPT-WO-FOUNDATION-002',
  role: 'DEVELOPER',
  workspace: REPO_ROOT,
  permissions: [
    {
      domain: DOMAIN.FILESYSTEM,
      action: ['read', 'write', 'create'],
      resource: join(TEST_DIR, '**'),
      authority_mode: AUTHORITY_MODE.AUTO_ALLOW,
      description: 'Authorized test directory',
    },
    {
      domain: DOMAIN.FILESYSTEM,
      action: ['write', 'create', 'delete'],
      resource: join(REPO_ROOT, 'docs/**'),
      authority_mode: AUTHORITY_MODE.DENY,
      description: 'Deny writes to docs tree',
    },
    {
      domain: DOMAIN.EXECUTION,
      action: ['run_command'],
      resource: 'echo*',
      authority_mode: AUTHORITY_MODE.AUTO_ALLOW,
      description: 'Allow echo commands',
    },
    {
      domain: DOMAIN.EXECUTION,
      action: ['run_command'],
      resource: '*',
      authority_mode: AUTHORITY_MODE.DENY,
      description: 'Deny all other shell commands',
    },
  ],
});

const adapter = createGooseAdapter({ root_dir: REPO_ROOT, state_dir: STATE_DIR });
await adapter.start({ task_id: 'DPT-FOUNDATION-002', work_order_id: 'DPT-WO-FOUNDATION-002', envelope });
const sessionId = await adapter.createSession({ task_id: 'DPT-FOUNDATION-002', work_order_id: 'DPT-WO-FOUNDATION-002' });

// ─── MCP Protocol with message queue ────────────────────────────────

const messageQueue = [];
let processing = false;
let rawBuffer = '';

function send(obj) {
  const s = JSON.stringify(obj);
  const header = `Content-Length: ${Buffer.byteLength(s)}\r\n\r\n`;
  stdout.write(header);
  stdout.write(s);
  process.stderr.write(`[DPT] SENT: ${s.slice(0, 200)}\n`);
}

function enqueueMessage(text) {
  try {
    const msg = JSON.parse(text);
    messageQueue.push(msg);
    process.stderr.write(`[DPT] Queued: ${msg.method} id=${msg.id}\n`);
    processQueue();
  } catch (e) {
    process.stderr.write(`[DPT] Parse error: ${e.message}\n`);
  }
}

async function processQueue() {
  if (processing || messageQueue.length === 0) return;
  processing = true;
  
  while (messageQueue.length > 0) {
    const msg = messageQueue.shift();
    await handleMessage(msg);
  }
  
  processing = false;
}

async function handleMessage(msg) {
  process.stderr.write(`[DPT] Processing: ${msg.method} id=${msg.id}\n`);
  
  if (msg.method === 'initialize') {
    send({
      jsonrpc: '2.0',
      id: msg.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'dpt-enforcer', version: '0.1.0' },
      },
    });
  } else if (msg.method === 'notifications/initialized') {
    // Notification, no response
  } else if (msg.method === 'tools/list') {
    send({
      jsonrpc: '2.0',
      id: msg.id,
      result: {
        tools: [
          {
            name: 'dpt_write',
            description: 'Write a file through DPT enforcement',
            inputSchema: {
              type: 'object',
              properties: { path: { type: 'string' }, content: { type: 'string' } },
              required: ['path', 'content'],
            },
          },
          {
            name: 'dpt_read',
            description: 'Read a file through DPT enforcement',
            inputSchema: {
              type: 'object',
              properties: { path: { type: 'string' } },
              required: ['path'],
            },
          },
          {
            name: 'dpt_shell',
            description: 'Execute a shell command through DPT enforcement',
            inputSchema: {
              type: 'object',
              properties: { command: { type: 'string' } },
              required: ['command'],
            },
          },
          {
            name: 'dpt_delete',
            description: 'Delete a file through DPT enforcement',
            inputSchema: {
              type: 'object',
              properties: { path: { type: 'string' } },
              required: ['path'],
            },
          },
          {
            name: 'dpt_execute_tool',
            description: 'Execute any tool through DPT runtime enforcement',
            inputSchema: {
              type: 'object',
              properties: {
                tool_name: { type: 'string' },
                params: { type: 'object' },
              },
              required: ['tool_name', 'params'],
            },
          },
        ],
      },
    });
  } else if (msg.method === 'tools/call') {
    const { name, arguments: args } = msg.params;
    // Strip 'dpt_' prefix for adapter
    const toolName = name.startsWith('dpt_') ? name.slice(4) : name;
    const params = args || {};
    
    process.stderr.write(`[DPT] Executing: ${toolName} ${JSON.stringify(params)}\n`);
    
    const result = await adapter.executeTool(sessionId, { tool_name: toolName, params });
    
    process.stderr.write(`[DPT] Result: ${result.status} - ${result.reason || ''}\n`);
    
    send({
      jsonrpc: '2.0',
      id: msg.id,
      result: {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      },
    });
  } else {
    send({
      jsonrpc: '2.0',
      id: msg.id ?? null,
      error: { code: -32601, message: `Method not found: ${msg.method}` },
    });
  }
}

// ─── Input Parser ───────────────────────────────────────────────────

function parseInput() {
  let offset = 0;
  
  while (offset < rawBuffer.length) {
    const headerEnd = rawBuffer.indexOf('\r\n\r\n', offset);
    if (headerEnd === -1) break;
    
    const headerBlock = rawBuffer.slice(offset, headerEnd);
    const headers = {};
    for (const line of headerBlock.split('\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).toLowerCase().trim();
        const val = line.slice(colonIdx + 1).trim();
        headers[key] = val;
      }
    }
    
    const len = parseInt(headers['content-length'] || '0', 10);
    if (isNaN(len) || len <= 0) break;
    
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + len;
    if (bodyEnd > rawBuffer.length) break;
    
    const body = rawBuffer.slice(bodyStart, bodyEnd);
    rawBuffer = rawBuffer.slice(bodyEnd);
    
    enqueueMessage(body);
    offset = 0;
  }
}

stdin.on('data', (chunk) => {
  rawBuffer += chunk.toString();
  process.stderr.write(`[DPT] Received ${chunk.length} bytes, buffer: ${rawBuffer.length}\n`);
  parseInput();
});

process.stderr.write('[DPT-Enforcer] Starting DPT enforcement extension\n');

// Keep process alive without top-level await
stdin.resume();
