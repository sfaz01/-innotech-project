// AgentGuard — Scenario Runner & Dual-Mode Execution Engine
// Implements deterministic Baseline vs Protected execution pipelines

import {
  DecisionResult,
  DualExecutionComparison,
  ExecutionMode,
  ExecutionResult,
  PolicyRule,
  Scenario,
  ToolAction,
} from '../types';
import { generateAgentProposal } from './mockAgent';
import { evaluatePolicy } from './policyEngine';
import { detectPII } from './piiDetector';
import {
  createInitialEnvironmentState,
  executeToolInSandbox,
} from './executionSandbox';
import { AuditLedger } from './auditLogger';

/**
 * Runs a scenario in either 'baseline' or 'protected' mode
 */
export function runScenario(
  scenario: Scenario,
  mode: ExecutionMode,
  activePolicies: PolicyRule[],
  options?: { humanApprovedReview?: boolean }
): ExecutionResult {
  const startTime = Date.now();
  const runId = `RUN-${mode.toUpperCase()}-${Date.now()}`;
  const ledger = new AuditLedger(runId, scenario.id, mode);
  const initialState = createInitialEnvironmentState();
  let currentState = initialState;

  // Step 1: Scenario started & task received
  ledger.recordEvent({
    eventType: 'SCENARIO_STARTED',
    explanation: `Started scenario execution for '${scenario.name}' in ${mode.toUpperCase()} mode.`,
    status: 'INFO',
  });

  // Step 2: Inspect untrusted document content
  ledger.recordEvent({
    eventType: 'INPUT_LOADED',
    explanation: `Loaded input document (${scenario.content.length} chars). Task: "${scenario.task}"`,
    status: 'INFO',
    payloadPreview: scenario.content.slice(0, 180) + (scenario.content.length > 180 ? '...' : ''),
  });

  // Check for PII in source document
  const documentPII = detectPII(scenario.content);
  if (documentPII.length > 0) {
    ledger.recordEvent({
      eventType: 'PII_DETECTED',
      explanation: `Detected ${documentPII.length} sensitive Indian identifier(s) in source document: ${documentPII.map(p => p.category).join(', ')}.`,
      status: 'INFO',
    });
  }

  // Step 3: Agent thought & reasoning generation
  const proposal = generateAgentProposal(scenario);
  ledger.recordEvent({
    eventType: 'AGENT_SUMMARY_GENERATED',
    explanation: `Mock Agent generated reasoning: "${proposal.thought.slice(0, 150)}..."`,
    status: 'INFO',
  });

  const executedActions: ToolAction[] = [];
  const blockedActions: ToolAction[] = [];
  const redactedActions: { original: ToolAction; transformed: ToolAction }[] = [];
  const decisions: DecisionResult[] = [];
  let attackSuccess = false;

  // Track sensitive data exposure at tool boundary
  const sensitiveDataLeaked: typeof documentPII = [];
  const sensitiveDataPrevented: typeof documentPII = [];

  // Step 4+: Process each proposed tool action
  for (const proposedAction of proposal.proposedActions) {
    ledger.recordEvent({
      eventType: 'TOOL_ACTION_PROPOSED',
      actionId: proposedAction.id,
      tool: proposedAction.tool,
      explanation: `Agent proposed action ${proposedAction.tool} with parameters. Rationale: ${proposedAction.rationale || 'None provided'}`,
      status: 'INFO',
      payloadPreview: JSON.stringify(proposedAction.parameters),
    });

    // Check if proposed action contains sensitive data
    const actionPII = detectPII(JSON.stringify(proposedAction.parameters));

    if (mode === 'baseline') {
      // BASELINE MODE: Execute directly without AgentGuard security policies!
      const baselineDecision: DecisionResult = {
        actionId: proposedAction.id,
        tool: proposedAction.tool,
        decision: 'ALLOW',
        matchedRules: [],
        reason: 'Baseline mode: Direct tool dispatch without AgentGuard policy enforcement layer.',
        originalPayloadFingerprint: 'none',
      };
      decisions.push(baselineDecision);

      ledger.recordEvent({
        eventType: 'POLICY_DECISION_ISSUED',
        actionId: proposedAction.id,
        tool: proposedAction.tool,
        decision: 'ALLOW',
        explanation: 'Baseline mode: Action dispatched directly to mock sandbox.',
        status: 'SUCCESS',
      });

      // Execute in sandbox
      const execOut = executeToolInSandbox(currentState, proposedAction);
      currentState = execOut.state;
      executedActions.push(proposedAction);

      ledger.recordEvent({
        eventType: 'ACTION_EXECUTED',
        actionId: proposedAction.id,
        tool: proposedAction.tool,
        explanation: `Tool executed in sandbox: ${execOut.message}`,
        status: execOut.success ? 'SUCCESS' : 'FAILED',
      });

      // If action contained sensitive data, it successfully leaked into destination/outbox
      if (actionPII.length > 0) {
        sensitiveDataLeaked.push(...actionPII);
      }

      // In baseline, adversarial scenarios succeed because there is no protection
      if (scenario.adversarialInstruction || scenario.type === 'DATA_EXFILTRATION' || scenario.type === 'PROMPT_INJECTION' || scenario.type === 'UNAUTHORIZED_ACTION') {
        attackSuccess = true;
      }
    } else {
      // PROTECTED MODE: Complete 10-step AgentGuard policy evaluation
      const decision = evaluatePolicy(proposedAction, scenario, activePolicies);
      decisions.push(decision);

      ledger.recordEvent({
        eventType: 'POLICY_EVALUATION_COMPLETED',
        actionId: proposedAction.id,
        tool: proposedAction.tool,
        explanation: `Security policies evaluated (${decision.matchedRules.length} rules matched). Preliminary verdict: ${decision.decision}`,
        matchedPolicyIds: decision.matchedRules.map(r => r.id),
        status: 'INFO',
      });

      ledger.recordEvent({
        eventType: 'POLICY_DECISION_ISSUED',
        actionId: proposedAction.id,
        tool: proposedAction.tool,
        decision: decision.decision,
        explanation: decision.reason,
        matchedPolicyIds: decision.matchedRules.map(r => r.id),
        status: decision.decision === 'BLOCK' ? 'BLOCKED' : decision.decision === 'REVIEW' ? 'PENDING' : 'SUCCESS',
      });

      if (decision.decision === 'BLOCK') {
        blockedActions.push(proposedAction);
        if (actionPII.length > 0) {
          sensitiveDataPrevented.push(...actionPII);
        }
        ledger.recordEvent({
          eventType: 'ACTION_BLOCKED',
          actionId: proposedAction.id,
          tool: proposedAction.tool,
          decision: 'BLOCK',
          explanation: `Action BLOCKED at tool boundary. Reason: ${decision.reason}`,
          matchedPolicyIds: decision.matchedRules.map(r => r.id),
          status: 'BLOCKED',
        });
        // Attack prevented!
        attackSuccess = false;
      } else if (decision.decision === 'REVIEW') {
        // Human-in-the-loop review required
        if (options?.humanApprovedReview) {
          // Human approved
          decision.reviewApproved = true;
          ledger.recordEvent({
            eventType: 'REVIEW_RESOLVED',
            actionId: proposedAction.id,
            tool: proposedAction.tool,
            decision: 'ALLOW',
            explanation: 'Human operator reviewed and approved high-impact action.',
            status: 'SUCCESS',
          });
          const execOut = executeToolInSandbox(currentState, proposedAction);
          currentState = execOut.state;
          executedActions.push(proposedAction);
          ledger.recordEvent({
            eventType: 'ACTION_EXECUTED',
            actionId: proposedAction.id,
            tool: proposedAction.tool,
            explanation: `Authorized action executed: ${execOut.message}`,
            status: 'SUCCESS',
          });
        } else {
          // Suspended awaiting human review
          blockedActions.push(proposedAction); // Kept from automatic execution
          ledger.recordEvent({
            eventType: 'ACTION_HELD_FOR_REVIEW',
            actionId: proposedAction.id,
            tool: proposedAction.tool,
            decision: 'REVIEW',
            explanation: 'Action suspended pending supervisor authorization. Execution prevented until approval.',
            matchedPolicyIds: decision.matchedRules.map(r => r.id),
            status: 'PENDING',
          });
        }
      } else if (decision.decision === 'REDACT') {
        const transformedAction = decision.transformedAction || proposedAction;
        redactedActions.push({
          original: proposedAction,
          transformed: transformedAction,
        });

        if (actionPII.length > 0) {
          sensitiveDataPrevented.push(...actionPII);
        }

        ledger.recordEvent({
          eventType: 'PAYLOAD_REDACTED',
          actionId: proposedAction.id,
          tool: proposedAction.tool,
          decision: 'REDACT',
          explanation: `Transformed payload: replaced sensitive spans with safe tokens before tool delivery.`,
          status: 'REDACTED',
          payloadPreview: JSON.stringify(proposedAction.parameters),
          transformedPayloadPreview: JSON.stringify(transformedAction.parameters),
        });

        // Execute transformed safe action
        const execOut = executeToolInSandbox(currentState, transformedAction);
        currentState = execOut.state;
        executedActions.push(transformedAction);

        ledger.recordEvent({
          eventType: 'ACTION_EXECUTED',
          actionId: proposedAction.id,
          tool: proposedAction.tool,
          explanation: `Redacted safe action dispatched: ${execOut.message}`,
          status: 'SUCCESS',
        });
      } else {
        // ALLOW
        const execOut = executeToolInSandbox(currentState, proposedAction);
        currentState = execOut.state;
        executedActions.push(proposedAction);

        ledger.recordEvent({
          eventType: 'ACTION_EXECUTED',
          actionId: proposedAction.id,
          tool: proposedAction.tool,
          explanation: `Allowed action dispatched: ${execOut.message}`,
          status: 'SUCCESS',
        });
      }
    }
  }

  // Step 10: Complete scenario
  ledger.recordEvent({
    eventType: 'SCENARIO_COMPLETED',
    explanation: `Execution completed in ${Date.now() - startTime}ms. Final status: ${attackSuccess ? 'COMPROMISED' : 'SECURE'}.`,
    status: attackSuccess ? 'FAILED' : 'SUCCESS',
  });

  // Calculate whether scenario matched its expected security behavior
  const finalDecision = decisions[0]?.decision || 'ALLOW';
  const passed =
    mode === 'protected'
      ? finalDecision === scenario.expectedDecision ||
        (scenario.expectedDecision === 'BLOCK' && finalDecision === 'REVIEW')
      : !attackSuccess; // For baseline, passing only if no attack occurred

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    mode,
    runId,
    agentThought: proposal.thought,
    proposedActions: proposal.proposedActions,
    decisions,
    executedActions,
    blockedActions,
    redactedActions,
    detectedPII: documentPII,
    sensitiveDataLeaked,
    sensitiveDataPrevented,
    stateBefore: initialState,
    stateAfter: currentState,
    attackSuccess,
    passed,
    auditEvents: ledger.getEvents(),
    executionTimeMs: Date.now() - startTime,
  };
}

/**
 * Runs both Baseline and Protected modes side-by-side with identical inputs and states
 */
export function runDualExecution(
  scenario: Scenario,
  activePolicies: PolicyRule[]
): DualExecutionComparison {
  const baseline = runScenario(scenario, 'baseline', activePolicies);
  const protectedRun = runScenario(scenario, 'protected', activePolicies);

  let divergencePoint: DualExecutionComparison['divergencePoint'] = undefined;

  // Determine where the two paths diverged
  if (baseline.executedActions.length > protectedRun.executedActions.length) {
    divergencePoint = {
      stepIndex: 5,
      description: 'Policy Enforcement Boundary Divergence',
      actionId: baseline.executedActions[0]?.id || 'ACT-01',
      baselineBehavior: `Executed ${baseline.executedActions[0]?.tool} unconditionally (resulting in vulnerability)`,
      protectedBehavior: `Blocked by ${protectedRun.decisions[0]?.matchedRules[0]?.id || 'AgentGuard Policy'} (${protectedRun.decisions[0]?.reason})`,
    };
  } else if (protectedRun.redactedActions.length > 0) {
    divergencePoint = {
      stepIndex: 7,
      description: 'Sensitive Data Payload Redaction',
      actionId: protectedRun.redactedActions[0].original.id,
      baselineBehavior: 'Dispatched raw payload containing unmasked Indian PII/SPII',
      protectedBehavior: 'Applied safe identifier masking token transformation before tool delivery',
    };
  }

  return {
    scenarioId: scenario.id,
    baseline,
    protected: protectedRun,
    divergencePoint,
  };
}
