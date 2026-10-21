// AgentGuard — Audit Logger & Tamper-Evident Ledger Simulation
// Generates structured audit records with deterministic SHA-256 style hash chaining

import { AuditEvent, AuditEventType, ExecutionMode, PolicyDecision, ToolName } from '../types';

/**
 * Deterministic pseudo-SHA256 simulation for demonstration of hash-chained audit logging
 */
export function computeSimulatedHash(input: string): string {
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const part3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  const part4 = ((h1 + h2) >>> 0).toString(16).padStart(8, '0');
  return `sha256-${part1}${part2}${part3}${part4}`;
}

export class AuditLedger {
  private events: AuditEvent[] = [];
  private runId: string;
  private scenarioId: string;
  private mode: ExecutionMode;
  private currentSequence: number = 0;
  private lastHash: string = '0000000000000000000000000000000000000000000000000000000000000000';

  constructor(runId: string, scenarioId: string, mode: ExecutionMode) {
    this.runId = runId;
    this.scenarioId = scenarioId;
    this.mode = mode;
  }

  public recordEvent(params: {
    eventType: AuditEventType;
    explanation: string;
    actionId?: string;
    tool?: ToolName;
    decision?: PolicyDecision;
    matchedPolicyIds?: string[];
    status: 'SUCCESS' | 'BLOCKED' | 'PENDING' | 'REDACTED' | 'FAILED' | 'INFO';
    payloadPreview?: string;
    transformedPayloadPreview?: string;
  }): AuditEvent {
    this.currentSequence++;
    const prevHash = this.lastHash;
    const timestamp = new Date().toISOString();

    const dataToHash = `${this.currentSequence}|${prevHash}|${params.eventType}|${params.explanation}|${params.decision || ''}|${params.payloadPreview || ''}`;
    const hash = computeSimulatedHash(dataToHash);
    this.lastHash = hash;

    const event: AuditEvent = {
      id: `EVT-${this.mode.slice(0, 4).toUpperCase()}-${this.scenarioId}-${this.currentSequence.toString().padStart(3, '0')}`,
      runId: this.runId,
      scenarioId: this.scenarioId,
      mode: this.mode,
      sequence: this.currentSequence,
      eventType: params.eventType,
      actionId: params.actionId,
      tool: params.tool,
      decision: params.decision,
      explanation: params.explanation,
      matchedPolicyIds: params.matchedPolicyIds || [],
      status: params.status,
      payloadPreview: params.payloadPreview,
      transformedPayloadPreview: params.transformedPayloadPreview,
      prevHash,
      hash,
      timestamp,
    };

    this.events.push(event);
    return event;
  }

  public getEvents(): AuditEvent[] {
    return [...this.events];
  }
}

/**
 * Validates the cryptographic integrity of an audit event chain
 */
export function verifyAuditChain(events: AuditEvent[]): { valid: boolean; brokenAtSequence?: number } {
  if (events.length === 0) return { valid: true };

  for (let i = 0; i < events.length; i++) {
    const current = events[i];
    const prevHash = i === 0 ? '0000000000000000000000000000000000000000000000000000000000000000' : events[i - 1].hash;

    if (current.prevHash !== prevHash) {
      return { valid: false, brokenAtSequence: current.sequence };
    }

    const dataToHash = `${current.sequence}|${prevHash}|${current.eventType}|${current.explanation}|${current.decision || ''}|${current.payloadPreview || ''}`;
    const expectedHash = computeSimulatedHash(dataToHash);

    if (current.hash !== expectedHash) {
      return { valid: false, brokenAtSequence: current.sequence };
    }
  }

  return { valid: true };
}
