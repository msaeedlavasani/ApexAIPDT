/**
 * CROSS_PROJECT_EXTRACT — Cross-Project Pattern Extraction Function
 * 
 * Implements the cross-project pattern extraction layer defined in ADR-056.
 * Aggregates failure patterns from multiple projects and identifies
 * systemic issues requiring coordinated improvement.
 * 
 * Design: Threshold-Based Aggregation (Design B)
 * - Minimum 5 projects for statistical significance (OD-T5-005-A)
 * - Privacy-preserving (aggregate counts only)
 * - Authority-aware weighting (deferred per OD-T5-005-B)
 */

import { randomUUID } from 'node:crypto';

/**
 * Default minimum project threshold per OD-T5-005-A
 */
const DEFAULT_MIN_PROJECTS = 5;

/**
 * Authority level weights
 */
const AUTHORITY_WEIGHTS = {
  CORE: 3,
  MAJOR: 2,
  STANDARD: 1,
};

/**
 * Format ISO timestamp (native replacement for date-fns)
 */
function formatISO(date) {
  return date.toISOString();
}

/**
 * Cross-Project Extraction Configuration
 */
export class CrossProjectConfig {
  /**
   * @param {Object} options
   * @param {number} [options.minProjects=5] - Minimum projects for significance (OD-T5-005-A)
   * @param {boolean} [options.enableRecommendations=true] - Generate recommendations
   * @param {boolean} [options.weightByAuthority=false] - Apply authority weighting (OD-T5-005-B deferred)
   */
  constructor(options = {}) {
    this.minProjects = options.minProjects ?? DEFAULT_MIN_PROJECTS;
    this.enableRecommendations = options.enableRecommendations ?? true;
    this.weightByAuthority = options.weightByAuthority ?? false;
  }

  /**
   * Create default config (OD-T5-005-A resolved: 5+ projects)
   */
  static default() {
    return new CrossProjectConfig({
      minProjects: DEFAULT_MIN_PROJECTS,
    });
  }
}

/**
 * Calculate significance based on project count
 */
function calculateSignificance(projectCount, minProjects) {
  const ratio = projectCount / minProjects;
  if (ratio >= 2) return 'HIGH';
  if (ratio >= 1) return 'MEDIUM';
  return 'LOW';
}

/**
 * Generate recommendation for a cross-project pattern
 */
function generateRecommendation(patternType, occurrenceCount, projectCount) {
  const recommendations = {
    RETRY_EXHAUSTED: {
      action: 'Implement shared retry middleware with exponential backoff across all affected projects.',
      priority: occurrenceCount / projectCount,
      impact: {
        projects_improved: projectCount,
        failures_prevented: Math.floor(occurrenceCount * 0.6),
      },
    },
    CONTEXT_OVERFLOW: {
      action: 'Develop shared context composition library with automatic pruning and compression.',
      priority: occurrenceCount / projectCount,
      impact: {
        projects_improved: projectCount,
        failures_prevented: Math.floor(occurrenceCount * 0.7),
      },
    },
    AUTHORITY_DENIED: {
      action: 'Review and standardize delegation policies across projects. Consider hierarchical delegation model.',
      priority: occurrenceCount / projectCount,
      impact: {
        projects_improved: projectCount,
        failures_prevented: Math.floor(occurrenceCount * 0.5),
      },
    },
    PROVIDER_ERROR: {
      action: 'Establish shared provider fallback chain with health monitoring and automatic failover.',
      priority: occurrenceCount / projectCount,
      impact: {
        projects_improved: projectCount,
        failures_prevented: Math.floor(occurrenceCount * 0.8),
      },
    },
    TIMEOUT: {
      action: 'Standardize timeout configuration with adaptive thresholds based on operation complexity.',
      priority: occurrenceCount / projectCount,
      impact: {
        projects_improved: projectCount,
        failures_prevented: Math.floor(occurrenceCount * 0.4),
      },
    },
    VALIDATION_FAIL: {
      action: 'Create shared validation rule sets with cross-project consistency checks.',
      priority: occurrenceCount / projectCount,
      impact: {
        projects_improved: projectCount,
        failures_prevented: Math.floor(occurrenceCount * 0.85),
      },
    },
    UNKNOWN: {
      action: 'Conduct cross-project investigation to classify and address unknown failure patterns.',
      priority: occurrenceCount / projectCount,
      impact: {
        projects_improved: projectCount,
        failures_prevented: Math.floor(occurrenceCount * 0.3),
      },
    },
  };
  
  return recommendations[patternType] || recommendations.UNKNOWN;
}

/**
 * Validate that a project report is valid for cross-project analysis
 */
export function isValidProjectReport(report) {
  if (!report) return false;
  if (!report.report_id) return false;
  if (!Array.isArray(report.patterns)) return false;
  if (!report.project_id) return false;
  return true;
}

/**
 * CROSS_PROJECT_EXTRACT — Main Exported Function
 * 
 * Extracts and aggregates patterns across multiple project reports.
 * 
 * @param {Array} projectReports - Array of FailurePatternReport per project
 * @param {CrossProjectConfig} [config] - Configuration options
 * @returns {Object} CrossProjectPatternReport
 */
export function CROSS_PROJECT_EXTRACT(projectReports, config = CrossProjectConfig.default()) {
  // Filter valid reports
  const validReports = projectReports.filter(isValidProjectReport);
  
  // Aggregate patterns by type across projects
  const patternAggregation = {};
  
  for (const report of validReports) {
    for (const pattern of report.patterns) {
      const type = pattern.pattern_type;
      if (!patternAggregation[type]) {
        patternAggregation[type] = {
          pattern_type: type,
          occurrences: [],
          projects: new Map(),
        };
      }
      
      patternAggregation[type].occurrences.push(pattern.count);
      patternAggregation[type].projects.set(report.project_id, {
        count: pattern.count,
        severity: pattern.severity,
        authority_level: report.authority_level || 1,
      });
    }
  }
  
  // Build cross-project patterns
  const patterns = [];
  
  for (const [patternType, data] of Object.entries(patternAggregation)) {
    const projectCount = data.projects.size;
    const occurrenceCount = data.occurrences.reduce((a, b) => a + b, 0);
    
    // Skip if below threshold
    if (projectCount < config.minProjects) {
      continue;
    }
    
    const significance = calculateSignificance(projectCount, config.minProjects);
    const projects = Array.from(data.projects.entries()).map(([projectId, info]) => ({
      project_id: projectId,
      count: info.count,
      severity: info.severity,
      authority_level: info.authority_level,
    }));
    
    const recommendation = config.enableRecommendations 
      ? generateRecommendation(patternType, occurrenceCount, projectCount)
      : null;
    
    patterns.push({
      pattern_type: patternType,
      occurrence_count: occurrenceCount,
      project_count: projectCount,
      significance,
      projects,
      recommendation,
    });
  }
  
  // Sort by occurrence count descending
  patterns.sort((a, b) => b.occurrence_count - a.occurrence_count);
  
  // Calculate summary
  const significantPatterns = patterns.filter(p => p.significance !== 'LOW').length;
  const totalProjects = new Set(projectReports.map(r => r.project_id)).size;
  const totalOccurrences = patterns.reduce((sum, p) => sum + p.occurrence_count, 0);
  
  return {
    report_id: randomUUID(),
    computed_at: formatISO(new Date()),
    threshold_config: {
      min_projects: config.minProjects,
    },
    patterns,
    summary: {
      total_patterns: patterns.length,
      significant_patterns: significantPatterns,
      total_projects_analyzed: totalProjects,
      total_occurrences: totalOccurrences,
    },
  };
}

/**
 * Get patterns above significance threshold
 */
export function getSignificantPatterns(report, significance = 'HIGH') {
  return report.patterns.filter(p => p.significance === significance);
}

/**
 * Get patterns by project
 */
export function getPatternsByProject(report, projectId) {
  return report.patterns.filter(p => 
    p.projects.some(proj => proj.project_id === projectId)
  );
}

/**
 * Calculate aggregate impact
 */
export function calculateAggregateImpact(report) {
  return report.patterns.reduce((acc, p) => {
    if (p.recommendation?.impact) {
      acc.projects_improved += p.recommendation.impact.projects_improved || 0;
      acc.failures_prevented += p.recommendation.impact.failures_prevented || 0;
    }
    return acc;
  }, { projects_improved: 0, failures_prevented: 0 });
}

/**
 * Cross-project pattern constants
 */
export const SIGNIFICANCE_LEVELS = ['LOW', 'MEDIUM', 'HIGH'];
export const AUTHORITY_LEVELS = ['CORE', 'MAJOR', 'STANDARD'];

export { calculateSignificance, generateRecommendation };
