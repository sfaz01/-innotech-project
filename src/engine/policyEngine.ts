// AgentGuard — Deterministic Policy Enforcement Engine
// Evaluates tool proposals at the security boundary without relying on LLM self-policing

import { DecisionResult, PolicyRule, Scenario, ToolAction } from '../types';
import { redactToolAction } from './redactionEngine';
import { validateToolParameters } from './toolRegistry';
import { detectPII } from './piiDetector';

/**
 * Computes a simple deterministic fingerprint for payload audit verification
 */
export function computePayloadFingerprint(data: any): string {
  const str = typeof data === 'string' ? data : JSON.stringify(data || {});
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'fp-' + Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Evaluates a proposed tool action against configured security policies and scenario constraints
 */
export function evaluatePolicy(
  action: ToolAction,
  scenario: Scenario,
  activePolicies: PolicyRule[]
): DecisionResult {
  const origFingerprint = computePayloadFingerprint(action.parameters);
  const matchedRules: PolicyRule[] = [];
  const reasons: string[] = [];

  // Sort enabled policies by priority descending
  const sortedRules = [...activePolicies]
    .filter(p => p.enabled)
    .sort((a, b) => b.priority - a.priority);

  let finalDecision: 'ALLOW' | 'BLOCK' | 'REDACT' | 'REVIEW' = 'ALLOW';
  let transformedAction: ToolAction | undefined = undefined;
  let transformedFingerprint: string | undefined = undefined;

  for (const rule of sortedRules) {
    // Check if rule applies to this tool
    if (rule.applicableTools !== 'ALL' && !rule.applicableTools.includes(action.tool)) {
      continue;
    }

    let isMatch = false;

    // Evaluate conditions within the rule
    for (const condition of rule.conditions) {
      switch (condition.field) {
        case 'tool': {
          if (condition.operator === 'NOT_IN_LIST') {
            // Check against scenario's permitted tools
            if (!scenario.permittedTools.includes(action.tool)) {
              isMatch = true;
            }
          } else if (condition.operator === 'EQUALS') {
            if (action.tool === condition.value) isMatch = true;
          }
          break;
        }

        case 'destination': {
          const dest = action.parameters.to || action.parameters.destination || '';
          if (condition.operator === 'NOT_IN_LIST') {
            const allowedDomains: string[] = Array.isArray(condition.value) ? condition.value : [];
            const isWhitelisted = allowedDomains.some(domain =>
              dest.toLowerCase().endsWith(domain.toLowerCase())
            );
            if (!isWhitelisted && dest.length > 0) {
              isMatch = true;
            }
          }
          break;
        }

        case 'recipient': {
          const recipient = action.parameters.recipient || action.parameters.to || '';
          if (condition.operator === 'REGEX_MATCH') {
            try {
              const regex = new RegExp(condition.value, 'i');
              if (regex.test(recipient)) isMatch = true;
            } catch {}
          }
          break;
        }

        case 'amount': {
          const amount = Number(action.parameters.amount) || 0;
          if (condition.operator === 'GREATER_THAN') {
            if (amount > Number(condition.value)) isMatch = true;
          }
          break;
        }

        case 'payload': {
          const payloadStr = JSON.stringify(action.parameters || {});
          if (condition.operator === 'CONTAINS') {
            if (payloadStr.toLowerCase().includes(String(condition.value).toLowerCase())) {
              isMatch = true;
            }
          } else if (condition.operator === 'REGEX_MATCH') {
            try {
              const regex = new RegExp(condition.value, 'i');
              if (regex.test(payloadStr)) isMatch = true;
            } catch {}
          } else if (condition.operator === 'HAS_PII') {
            const ignoredEmails = action.tool === 'SendEmail' && action.parameters?.to ? [action.parameters.to] : [];
            const detections = detectPII(payloadStr, { ignoredEmails });
            if (detections.length > 0) {
              isMatch = true;
            }
          }
          break;
        }

        case 'prompt': {
          // Check both the scenario's untrusted content and the task
          const combinedPrompt = `${scenario.content} ${scenario.task} ${action.rationale || ''}`;
          if (condition.operator === 'REGEX_MATCH') {
            try {
              const regex = new RegExp(condition.value, 'i');
              if (regex.test(combinedPrompt)) isMatch = true;
            } catch {}
          }
          break;
        }

        case 'parameterName': {
          if (rule.id === 'POL-006') {
            const validation = validateToolParameters(action);
            if (!validation.valid) {
              isMatch = true;
              reasons.push(validation.errors.join('; '));
            }
          }
          break;
        }
      }
    }

    if (isMatch) {
      matchedRules.push(rule);
      reasons.push(rule.reason);

      // Decision resolution logic: BLOCK always wins
      if (rule.decision === 'BLOCK') {
        finalDecision = 'BLOCK';
        break; // Mandatory denial halts further permissive checks
      } else if (rule.decision === 'REVIEW') {
        finalDecision = 'REVIEW';
      } else if (rule.decision === 'REDACT') {
        if (finalDecision !== 'REVIEW') {
          finalDecision = 'REDACT';
        }
      }
    }
  }

  // If final decision is REDACT, execute the payload redaction
  if (finalDecision === 'REDACT') {
    const ignoredEmails = action.tool === 'SendEmail' && action.parameters?.to ? [action.parameters.to] : [];
    const { action: transformed, detections } = redactToolAction(action, { ignoredEmails });
    transformedAction = transformed;
    transformedFingerprint = computePayloadFingerprint(transformed.parameters);

    // If redaction took place, check if any unmasked sensitive or blocked payload remains
    if (detections.length > 0) {
      reasons.push(
        `Redacted ${detections.length} sensitive Indian identifier(s): ${detections.map(d => d.category).join(', ')}.`
      );
    }
  }

  // Default explanation if no rules matched
  const finalReason =
    reasons.length > 0
      ? reasons.join(' | ')
      : 'Action meets all validation criteria and permitted task bounds.';

  return {
    actionId: action.id,
    tool: action.tool,
    decision: finalDecision,
    matchedRules,
    reason: finalReason,
    originalPayloadFingerprint: origFingerprint,
    transformedPayloadFingerprint: transformedFingerprint,
    transformedAction,
    requiresHumanReview: finalDecision === 'REVIEW',
    reviewApproved: false,
  };
}
