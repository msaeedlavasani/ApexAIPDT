import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';

export class ChildProcessExecutor {
  constructor({ cwd, command = process.execPath, args = [], timeoutMs = 120000 } = {}) { this.cwd = cwd; this.command = command; this.args = args; this.timeoutMs = timeoutMs; }
  prepare(workOrder, envelope) {
    if (!workOrder?.work_order_id || !envelope?.envelope_id) return { allowed: false, error: 'WORK_ORDER_OR_ENVELOPE_MISSING' };
    if (envelope.allowed_paths && !Array.isArray(envelope.allowed_paths)) return { allowed: false, error: 'INVALID_ALLOWED_PATHS' };
    if (envelope.denied_paths?.some(p => envelope.allowed_paths?.includes(p))) return { allowed: false, error: 'CONFLICTING_PATH_POLICY' };
    return { allowed: true, runtime_id: `child:${process.pid}:${randomUUID()}` };
  }
  execute(workOrder, envelope) {
    const preflight = this.prepare(workOrder, envelope);
    if (!preflight.allowed) return Promise.resolve({ success: false, error: preflight.error });
    const attemptId = randomUUID();
    return new Promise(resolve => {
      const child = spawn(this.command, this.args, { cwd: this.cwd, env: { ...process.env, DPT_WORK_ORDER_ID: workOrder.work_order_id, DPT_ATTEMPT_ID: attemptId, DPT_ENVELOPE_ID: envelope.envelope_id }, stdio: ['ignore','pipe','pipe'] });
      let stdout = '', stderr = ''; const timer = setTimeout(() => child.kill('SIGTERM'), this.timeoutMs);
      child.stdout.on('data', d => { stdout += d; }); child.stderr.on('data', d => { stderr += d; });
      child.on('close', code => { clearTimeout(timer); resolve({ success: code === 0, attempt_id: attemptId, runtime_id: preflight.runtime_id, exit_code: code, stdout, stderr }); });
      child.on('error', error => { clearTimeout(timer); resolve({ success: false, attempt_id: attemptId, error: error.message }); });
    });
  }
}
