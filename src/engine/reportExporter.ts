// AgentGuard — Report Exporter
// Handles JSON, CSV, and formatted printable reports

import { AuditEvent, EvaluationMetrics } from '../types';

/**
 * Triggers a browser file download for text/blob content
 */
export function triggerFileDownload(filename: string, content: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Generates structured JSON export of benchmark metrics and audit events
 */
export function exportMetricsJSON(metrics: EvaluationMetrics, recentEvents: AuditEvent[]): string {
  const report = {
    product: 'AgentGuard — AI Agent Security & Privacy Lab',
    version: '1.0.0-ind-lab',
    timestamp: new Date().toISOString(),
    metrics: {
      totalScenarios: metrics.totalScenarios,
      baselineAttackSuccessRate: `${metrics.baselineASR}%`,
      protectedAttackSuccessRate: `${metrics.protectedASR}%`,
      attackBlockRate: `${metrics.attackBlockRate}%`,
      falsePositiveRate: `${metrics.falsePositiveRate}%`,
      sensitiveDataPassRate: `${metrics.sensitiveDataPassRate}%`,
      sensitiveDataChecked: metrics.sensitiveDataChecked,
      sensitiveDataPrevented: metrics.sensitiveDataPrevented,
      sensitiveDataRedacted: metrics.sensitiveDataRedacted,
      decisions: metrics.decisionsCount,
    },
    categoryBreakdown: metrics.categoryBreakdown,
    scenarioResults: metrics.scenarioResults,
    auditTrailSample: recentEvents.slice(0, 50).map(e => ({
      sequence: e.sequence,
      mode: e.mode,
      scenarioId: e.scenarioId,
      eventType: e.eventType,
      decision: e.decision,
      status: e.status,
      hash: e.hash,
      explanation: e.explanation,
    })),
  };

  return JSON.stringify(report, null, 2);
}

/**
 * Generates CSV string of scenario evaluation outcomes
 */
export function exportScenariosCSV(metrics: EvaluationMetrics): string {
  const headers = [
    'Scenario ID',
    'Scenario Name',
    'Category',
    'Severity',
    'Expected Decision',
    'Baseline Outcome',
    'Protected Decision',
    'Status',
    'Explanation',
  ];

  const rows = metrics.scenarioResults.map(r => [
    `"${r.scenarioId}"`,
    `"${r.name.replace(/"/g, '""')}"`,
    `"${r.category}"`,
    `"${r.severity}"`,
    `"${r.expectedDecision}"`,
    `"${r.baselineDecision}"`,
    `"${r.protectedDecision}"`,
    `"${r.passed ? 'PASSED' : 'FAILED'}"`,
    `"${r.explanation.replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Generates CSV string of audit event logs
 */
export function exportAuditCSV(events: AuditEvent[]): string {
  const headers = [
    'Sequence',
    'Event ID',
    'Timestamp',
    'Mode',
    'Scenario ID',
    'Event Type',
    'Tool',
    'Decision',
    'Status',
    'Explanation',
    'Simulated Hash',
  ];

  const rows = events.map(e => [
    e.sequence,
    `"${e.id}"`,
    `"${e.timestamp}"`,
    `"${e.mode}"`,
    `"${e.scenarioId}"`,
    `"${e.eventType}"`,
    `"${e.tool || 'N/A'}"`,
    `"${e.decision || 'N/A'}"`,
    `"${e.status}"`,
    `"${(e.explanation || '').replace(/"/g, '""')}"`,
    `"${e.hash}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
