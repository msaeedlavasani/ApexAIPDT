/**
 * DPT Analysis + Bounded Result + Project Readback Module
 */
import { randomUUID } from 'crypto';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const REPO_ROOT = process.cwd();
const ANALYSES_DIR = join(REPO_ROOT, '.dpt', 'analyses');

export function createAnalysis(contextPackageId, frontId) {
  const analysisId = 'ANALYSIS-' + randomUUID().replace(/-/g, '').toUpperCase().slice(0, 8);
  const analysis = {
    analysis_id: analysisId,
    context_package: contextPackageId,
    front_id: frontId,
    result: null,
    readback: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  saveAnalysis(analysis);
  return analysis;
}

export function executeAnalysis(analysisId, findings, confidence, authorityUsed) {
  const analysis = loadAnalysis(analysisId);
  if (!analysis) throw new Error('Analysis not found: ' + analysisId);
  if (analysis.result) throw new Error('Analysis already has result');
  analysis.result = {
    findings: findings || [],
    confidence: Math.min(1, Math.max(0, confidence || 0.5)),
    authority_used: authorityUsed || 'none',
    bounds_respected: true,
    generated_at: new Date().toISOString()
  };
  analysis.updated_at = new Date().toISOString();
  saveAnalysis(analysis);
  return analysis;
}

export function deliverResult(analysisId, format) {
  const analysis = loadAnalysis(analysisId);
  if (!analysis) throw new Error('Analysis not found: ' + analysisId);
  if (!analysis.result) throw new Error('No result to deliver');
  analysis.readback = {
    readable_by_project: true,
    readback_format: format || 'json',
    delivered_at: new Date().toISOString()
  };
  analysis.updated_at = new Date().toISOString();
  saveAnalysis(analysis);
  return analysis;
}

export function isAnalysisComplete(analysisId) {
  const analysis = loadAnalysis(analysisId);
  if (!analysis) return false;
  return analysis.result !== null && analysis.readback !== null;
}

export function getAnalysisStatus(analysisId) {
  const analysis = loadAnalysis(analysisId);
  if (!analysis) return null;
  return {
    analysis_id: analysis.analysis_id,
    context_package: analysis.context_package,
    front_id: analysis.front_id,
    has_result: !!analysis.result,
    has_readback: !!analysis.readback,
    is_complete: isAnalysisComplete(analysisId),
    confidence: analysis.result?.confidence || null,
    findings_count: analysis.result?.findings?.length || 0,
    bounds_respected: analysis.result?.bounds_respected || false
  };
}

export function listAnalyses() {
  if (!existsSync(ANALYSES_DIR)) return [];
  const files = readdirSync(ANALYSES_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => loadAnalysis(f.replace('.json', '')));
}

function ensureAnalysesDir() {
  if (!existsSync(ANALYSES_DIR)) mkdirSync(ANALYSES_DIR, { recursive: true });
}

function getAnalysisPath(analysisId) {
  return join(ANALYSES_DIR, analysisId + '.json');
}

function saveAnalysis(analysis) {
  ensureAnalysesDir();
  writeFileSync(getAnalysisPath(analysis.analysis_id), JSON.stringify(analysis, null, 2));
}

function loadAnalysis(analysisId) {
  const path = getAnalysisPath(analysisId);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

import { readdirSync } from 'fs';
