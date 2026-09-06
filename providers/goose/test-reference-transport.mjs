/**
 * Tests for Reference Transport (V3-008)
 */
import { describe, it, before, after } from 'node:test';
import { transports } from './reference-transport.mjs';
import assert from 'node:assert';
import { fileURLToPath } from 'url';
import {
  createTransport,
  stageUpdate,
  initiatePropagation,
  markDelivered,
  acknowledgeReceipt,
  verifyIntegrity,
  getTransport,
  listTransports,
  listActiveTransports
} from './reference-transport.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

describe('Reference Transport', () => {
  before(() => { transports.clear(); });
  it('should create transport with default GIT_REFERENCE type', async () => {
    const trns = createTransport('source', 'dest');
    assert.ok(trns.transport_id.startsWith('TRNS-'));
    assert.equal(trns.transport_type, 'GIT_REFERENCE');
    assert.equal(trns.propagation_status, 'PENDING');
  });

  it('should create transport with specified type', async () => {
    const trns = createTransport('source', 'dest', 'API_CALLBACK');
    assert.equal(trns.transport_type, 'API_CALLBACK');
  });

  it('should reject invalid transport type', async () => {
    assert.throws(() => {
      createTransport('source', 'dest', 'INVALID_TYPE');
    }, /Invalid transport type/);
  });

  it('should stage update with hash', async () => {
    const trns = createTransport('source', 'dest');
    const staged = stageUpdate(trns.transport_id, { key: 'value', version: '1.0' });
    assert.ok(staged.update_hash);
    assert.ok(staged.updated_data);
  });

  it('should reject staging when not in PENDING status', async () => {
    const trns = createTransport('source', 'dest');
    stageUpdate(trns.transport_id, { data: 'test' });
    initiatePropagation(trns.transport_id);
    
    assert.throws(() => {
      stageUpdate(trns.transport_id, {});
    }, /not in PENDING/);
  });

  it('should initiate propagation', async () => {
    const trns = createTransport('source', 'dest');
    stageUpdate(trns.transport_id, { data: 'test' });
    const initiated = initiatePropagation(trns.transport_id);
    assert.equal(initiated.propagation_status, 'IN_TRANSIT');
  });

  it('should reject initiation without staged update', async () => {
    const trns = createTransport('source', 'dest');
    assert.throws(() => {
      initiatePropagation(trns.transport_id);
    }, /no staged update/);
  });

  it('should mark as delivered', async () => {
    const trns = createTransport('source', 'dest');
    stageUpdate(trns.transport_id, { data: 'test' });
    initiatePropagation(trns.transport_id);
    const delivered = markDelivered(trns.transport_id);
    assert.equal(delivered.propagation_status, 'DELIVERED');
    assert.ok(delivered.delivered_at);
  });

  it('should acknowledge receipt', async () => {
    const trns = createTransport('source', 'dest');
    stageUpdate(trns.transport_id, { data: 'test' });
    initiatePropagation(trns.transport_id);
    markDelivered(trns.transport_id);
    
    const acked = acknowledgeReceipt(trns.transport_id, 'dest-project');
    assert.equal(acked.propagation_status, 'ACKNOWLEDGED');
    assert.equal(acked.acknowledged_by, 'dest-project');
    assert.ok(acked.acknowledged_at);
  });

  it('should verify integrity', async () => {
    const trns = createTransport('source', 'dest');
    const testData = { key: 'value', timestamp: Date.now() };
    stageUpdate(trns.transport_id, testData);
    
    const verification = verifyIntegrity(trns.transport_id, testData);
    assert.equal(verification.valid, true);
    assert.ok(verification.expected_hash);
    assert.equal(verification.expected_hash, verification.computed_hash);
  });

  it('should detect tampered data', async () => {
    const trns = createTransport('source', 'dest');
    stageUpdate(trns.transport_id, { original: 'data' });
    
    const verification = verifyIntegrity(trns.transport_id, { tampered: 'data' });
    assert.equal(verification.valid, false);
  });

  it('should list transports', async () => {
    createTransport('a', 'b');
    createTransport('c', 'd');
    
    const list = listTransports();
    assert.ok(list.length >= 2);
  });

  it('should list active transports', async () => {
    transports.clear();
    const t1 = createTransport('a', 'b');
    const t2 = createTransport('c', 'd');
    
    // Complete one transport
    stageUpdate(t1.transport_id, {});
    initiatePropagation(t1.transport_id);
    markDelivered(t1.transport_id);
    acknowledgeReceipt(t1.transport_id, 'b');
    
    const active = listActiveTransports();
    assert.equal(active.length, 1);
    assert.equal(active[0].transport_id, t2.transport_id);
  });

  it('full lifecycle: create → stage → propagate → deliver → acknowledge', async () => {
    const trns = createTransport('source-project', 'dest-project', 'GIT_REFERENCE');
    assert.equal(trns.propagation_status, 'PENDING');
    
    stageUpdate(trns.transport_id, { update: 'content' });
    assert.ok(trns.update_hash);
    
    initiatePropagation(trns.transport_id);
    assert.equal(trns.propagation_status, 'IN_TRANSIT');
    
    markDelivered(trns.transport_id);
    assert.equal(trns.propagation_status, 'DELIVERED');
    
    acknowledgeReceipt(trns.transport_id, 'dest-project');
    assert.equal(trns.propagation_status, 'ACKNOWLEDGED');
  });
});

console.log('Running Reference Transport tests...\n');
