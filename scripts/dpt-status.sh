#!/usr/bin/env bash
# DPT Live Execution Status — persistent user-visible TODO view
# Derives from canonical execution state (TASKS.md + .dpt/status.json)
# Usage: dpt-status.sh [--watch] [--json]
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../" && pwd)"
TASKS_MD="${REPO_ROOT}/docs/TASKS.md"
STATUS_JSON="${REPO_ROOT}/.dpt/status.json"

# Verify prerequisites
if [[ ! -f "$TASKS_MD" ]]; then
  echo "ERROR: docs/TASKS.md not found" >&2
  exit 1
fi

# ─── Parse TASKS.md and status ────────────────────────────────────
parse_and_status() {
  python3 -c "
import re, json, sys, subprocess, os
from datetime import datetime, timezone

tasks_md = open('${TASKS_MD}').read()
status_file = '${STATUS_JSON}'

# Parse [TASK] blocks
task_blocks = re.findall(r'\[TASK\]\n(.*?)\[\/TASK\]', tasks_md, re.DOTALL)
tasks = []
for block in task_blocks:
    fields = {}
    for line in block.strip().split('\n'):
        idx = line.find(':')
        if idx > 0:
            key = line[:idx].strip()
            val = line[idx+1:].strip()
            fields[key] = val
    if fields.get('task_id'):
        tasks.append(fields)

# Classify
running = [t for t in tasks if t.get('status') in ('RUNNING','ASSIGNED','DISPATCHED')]
ready = [t for t in tasks if t.get('status') == 'BACKLOG' and 'READY' in t.get('readiness','') and 'NOT_READY' not in t.get('readiness','')]
backlog = [t for t in tasks if t.get('status') == 'BACKLOG']
closed = [t for t in tasks if t.get('status') == 'CLOSED']

# Current execution task
exec_task = running[0]['task_id'] if running else (ready[0]['task_id'] if ready else 'none')

# Queue (next ready tasks)
queue = [t['task_id'] for t in ready]

# Blocked (backlog with NOT_READY)
blocked = [t['task_id'] for t in backlog if 'NOT_READY' in t.get('readiness','') or 'dependencies' in t.get('readiness','').lower()]

# Max state revision from all records AND deltas (both formats)
all_revs = re.findall(r'state_revision:\s*(\d+)', tasks_md)
delta_revs = re.findall(r'state_revision=\d+→(\d+)', tasks_md)
all_values = [int(r) for r in all_revs] + [int(r) for r in delta_revs]
max_rev = max(all_values) if all_values else 0

# CI status via gh
ci_conc = 'unknown'
ci_sha = 'n/a'
try:
    result = subprocess.run(
        ['gh', 'run', 'list', '--branch', 'main', '--limit', '1', '--json', 'conclusion,headSha,createdAt'],
        capture_output=True, text=True, timeout=10
    )
    if result.returncode == 0 and result.stdout.strip():
        runs = json.loads(result.stdout)
        if runs:
            ci_conc = runs[0].get('conclusion', 'unknown')
            ci_sha = runs[0].get('headSha', 'n/a')[:8]
except Exception:
    pass

total = len(tasks)
open_count = len([t for t in tasks if t.get('status') != 'CLOSED'])
progress_pct = int((total - open_count) * 100 / total) if total > 0 else 0

now = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

output = {
    'version': 1,
    'created_at': now,
    'last_updated': now,
    'execution': {
        'current_task': exec_task,
        'current_step': 'planning' if exec_task == 'none' else 'active',
        'completed_steps': [],
        'attempts': 0,
        'last_result': None,
        'last_result_time': None
    },
    'queue': {
        'next_tasks': queue
    },
    'blocked': {
        'items': blocked
    },
    'ci': {
        'last_run_id': None,
        'last_conclusion': ci_conc,
        'last_sha': ci_sha,
        'last_run_time': None
    },
    'state_revision': max_rev,
    'summary': {
        'total_tasks': total,
        'open_tasks': open_count,
        'closed_tasks': len(closed),
        'progress_pct': progress_pct
    }
}

# Merge with existing status file if present
if os.path.exists(status_file):
    try:
        with open(status_file) as f:
            prev = json.load(f)
        # Preserve runtime execution state
        output['execution'] = {**output['execution'], **prev.get('execution', {})}
        output['created_at'] = prev.get('created_at', now)
    except Exception:
        pass

with open(status_file, 'w') as f:
    json.dump(output, f, indent=2)

print(json.dumps(output, indent=2))
"
}

# ─── Display human-readable status ────────────────────────────────
display_status() {
  local json_input="$1"
  
  echo "═══════════════════════════════════════════════════════════════"
  echo "  DPT LIVERUN — Execution Status"
  echo "  Updated: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  
  # Current Task
  local cur_task
  cur_task=$(echo "$json_input" | jq -r '.execution.current_task // "none"')
  echo "  CURRENT TASK:   ${cur_task}"
  
  # Current Step
  local cur_step
  cur_step=$(echo "$json_input" | jq -r '.execution.current_step // "planning"')
  echo "  CURRENT STEP:   ${cur_step}"
  
  # Completed Steps
  local completed
  completed=$(echo "$json_input" | jq -r '.execution.completed_steps | if length > 0 then join(", ") else "none yet" end')
  echo "  COMPLETED:      ${completed}"
  
  # Attempt count
  local attempts
  attempts=$(echo "$json_input" | jq -r '.execution.attempts // 0')
  echo "  ATTEMPTS:       ${attempts}"
  
  # Last result
  local last_result
  last_result=$(echo "$json_input" | jq -r '.execution.last_result // "no result yet"')
  echo "  LAST RESULT:    ${last_result}"
  echo ""
  
  # Queued Next Steps
  local queued
  queued=$(echo "$json_input" | jq -r '.queue.next_tasks | if length > 0 then join(" → ") else "none" end')
  echo "  QUEUED NEXT:    ${queued}"
  echo ""
  
  # Blocked Items
  local blocked_count
  blocked_count=$(echo "$json_input" | jq -r '.blocked.items | length')
  if [[ "$blocked_count" -gt 0 ]]; then
    local blocked_list
    blocked_list=$(echo "$json_input" | jq -r '.blocked.items | join(", ")')
    echo "  BLOCKED (${blocked_count}): ${blocked_list}"
  else
    echo "  BLOCKED:        none"
  fi
  echo ""
  
  # CI Status
  local ci_conc ci_sha
  ci_conc=$(echo "$json_input" | jq -r '.ci.last_conclusion // "unknown"')
  ci_sha=$(echo "$json_input" | jq -r '.ci.last_sha // "n/a"')
  echo "  CI STATUS:      ${ci_conc} (sha: ${ci_sha})"
  echo ""
  
  # Overall Progress
  local total_tasks open_tasks state_rev progress_pct
  total_tasks=$(echo "$json_input" | jq -r '.summary.total_tasks // 0')
  open_tasks=$(echo "$json_input" | jq -r '.summary.open_tasks // 0')
  state_rev=$(echo "$json_input" | jq -r '.state_revision // 0')
  progress_pct=$(echo "$json_input" | jq -r '.summary.progress_pct // 0')
  echo "  PROGRESS:       ${progress_pct}% (${total_tasks} total, ${open_tasks} remaining, state_revision ${state_rev})"
  echo ""
  
  # Task detail table
  echo "  ─── Task Ledger ───────────────────────────────────────────"
  printf "  %-30s %-12s %s\n" "TASK" "STATUS" "NEXT"
  echo "  ───────────────────────────────────────────────────────────"
  python3 -c "
import re, sys
text = open('${TASKS_MD}').read()
tasks = re.findall(r'\[TASK\]\n(.*?)\[\/TASK\]', text, re.DOTALL)
for block in tasks:
    fields = {}
    for line in block.strip().split('\n'):
        idx = line.find(':')
        if idx > 0:
            fields[line[:idx].strip()] = line[idx+1:].strip()
    tid = fields.get('task_id','?')[:28]
    st = fields.get('status','?')
    nxt = fields.get('next_task','—')
    if len(nxt) > 20: nxt = nxt[:17] + '...'
    print(f'  {tid:<30} {st:<12} {nxt}')
"
  echo "  ───────────────────────────────────────────────────────────"
  echo ""
}

# ─── Main ────────────────────────────────────────────────────────
MODE="text"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --watch) MODE="watch"; shift ;;
    --json)  MODE="json"; shift ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

case "$MODE" in
  json)
    parse_and_status
    ;;
  watch)
    while true; do
      clear
      parse_and_status > /dev/null
      display_status "$(cat "$STATUS_JSON")"
      sleep 5
    done
    ;;
  text)
    parse_and_status > /dev/null
    display_status "$(cat "$STATUS_JSON")"
    ;;
esac
