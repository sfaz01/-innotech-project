// AgentGuard — Core Type Definitions

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type PolicyDecision = 'ALLOW' | 'BLOCK' | 'REDACT' | 'REVIEW';

export type ScenarioCategory =
  | 'BENIGN_WORKFLOW'
  | 'PROMPT_INJECTION'
  | 'HINGLISH_JAILBREAK'
  | 'DATA_EXFILTRATION'
  | 'SYNTHETIC_PII_EXPOSURE'
  | 'FINANCIAL_FRAUD'
  | 'UNAUTHORIZED_TOOL'
  | 'SYSTEM_SECRET_EXTRACTION'
  | 'FALSE_POSITIVE_CHECK'
  | 'MULTI_STEP_PIPELINE';

export type ScenarioType =
  | 'BENIGN'
  | 'PROMPT_INJECTION'
  | 'DATA_EXFILTRATION'
  | 'UNAUTHORIZED_ACTION'
  | 'PII_LEAK'
  | 'MULTI_STEP';

export type ExecutionMode = 'baseline' | 'protected';

export type ToolName =
  | 'ReadDocument'
  | 'SearchRecords'
  | 'SendEmail'
  | 'ExportData'
  | 'ProcessPayment'
  | 'UpdateRecord'
  | 'RevealSecret';

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
}

export interface ToolDefinition {
  name: ToolName;
  description: string;
  parameters: ToolParameter[];
  isHighImpact: boolean;
  requiresReviewByDefault: boolean;
  allowedDestinations?: string[];
}

export interface ToolAction {
  id: string;
  tool: ToolName;
  parameters: Record<string, any>;
  timestamp: string;
  rationale?: string;
  sensitiveSpansFound?: PIIDetection[];
}

export type ConditionOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'REGEX_MATCH'
  | 'IN_LIST'
  | 'NOT_IN_LIST'
  | 'GREATER_THAN'
  | 'HAS_PII';

export interface PolicyCondition {
  field: 'tool' | 'destination' | 'recipient' | 'amount' | 'payload' | 'prompt' | 'parameterName';
  operator: ConditionOperator;
  value: any;
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: Severity;
  priority: number; // Higher runs first, e.g. 100 > 75 > 50
  applicableTools: ToolName[] | 'ALL';
  conditions: PolicyCondition[];
  decision: PolicyDecision;
  reason: string;
  redactionType?: 'SYNTHETIC_PII' | 'CUSTOM_MASK';
  isCustom?: boolean;
}

export type PIICategory = 'AADHAAR' | 'PAN' | 'PHONE' | 'EMAIL' | 'UPI' | 'CUSTOM';

export interface PIIDetection {
  id: string;
  category: PIICategory;
  raw: string;
  masked: string;
  start: number;
  end: number;
  confidence: number;
  explanation: string;
}

export interface MockCustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  pan: string;
  aadhaar: string;
  balance: number;
  kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
}

export interface MockEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  redacted: boolean;
}

export interface MockPayment {
  id: string;
  recipientUpiOrAccount: string;
  amount: number;
  currency: string;
  status: 'COMPLETED' | 'PENDING_APPROVAL' | 'BLOCKED';
  timestamp: string;
}

export interface MockExport {
  id: string;
  fileName: string;
  recordCount: number;
  data: string;
  timestamp: string;
}

export interface EnvironmentState {
  customerRecords: MockCustomerRecord[];
  outbox: MockEmail[];
  paymentsLedger: MockPayment[];
  exportedFiles: MockExport[];
  systemSecrets: Record<string, string>;
}

export interface DecisionResult {
  actionId: string;
  tool: ToolName;
  decision: PolicyDecision;
  matchedRules: PolicyRule[];
  reason: string;
  originalPayloadFingerprint: string;
  transformedPayloadFingerprint?: string;
  transformedAction?: ToolAction;
  requiresHumanReview?: boolean;
  reviewApproved?: boolean;
}

export type AuditEventType =
  | 'SCENARIO_STARTED'
  | 'INPUT_LOADED'
  | 'AGENT_SUMMARY_GENERATED'
  | 'PII_DETECTED'
  | 'TOOL_ACTION_PROPOSED'
  | 'POLICY_EVALUATION_COMPLETED'
  | 'POLICY_DECISION_ISSUED'
  | 'PAYLOAD_REDACTED'
  | 'ACTION_BLOCKED'
  | 'ACTION_HELD_FOR_REVIEW'
  | 'REVIEW_RESOLVED'
  | 'ACTION_EXECUTED'
  | 'SCENARIO_COMPLETED';

export interface AuditEvent {
  id: string;
  runId: string;
  scenarioId: string;
  mode: ExecutionMode;
  sequence: number;
  eventType: AuditEventType;
  actionId?: string;
  tool?: ToolName;
  decision?: PolicyDecision;
  explanation: string;
  matchedPolicyIds: string[];
  status: 'SUCCESS' | 'BLOCKED' | 'PENDING' | 'REDACTED' | 'FAILED' | 'INFO';
  payloadPreview?: string;
  transformedPayloadPreview?: string;
  prevHash: string;
  hash: string;
  timestamp: string;
}

export interface Scenario {
  id: string;
  name: string;
  category: ScenarioCategory;
  severity: Severity;
  type: ScenarioType;
  content: string; // The synthetic document, email, or ticket
  task: string; // The trusted agent prompt / user instruction
  adversarialInstruction?: string; // Highlightable malicious instruction if present
  expectedTool: ToolName;
  expectedDecision: PolicyDecision;
  expectedState: 'SAFE' | 'COMPROMISED' | 'BLOCKED' | 'PENDING_REVIEW';
  description: string;
  explanation: string;
  language: 'English' | 'Hinglish';
  permittedTools: ToolName[];
  authorizedDestinations: string[];
  isCustom?: boolean;
}

export interface ExecutionResult {
  scenarioId: string;
  scenarioName: string;
  mode: ExecutionMode;
  runId: string;
  agentThought: string;
  proposedActions: ToolAction[];
  decisions: DecisionResult[];
  executedActions: ToolAction[];
  blockedActions: ToolAction[];
  redactedActions: { original: ToolAction; transformed: ToolAction }[];
  detectedPII: PIIDetection[];
  sensitiveDataLeaked: PIIDetection[];
  sensitiveDataPrevented: PIIDetection[];
  stateBefore: EnvironmentState;
  stateAfter: EnvironmentState;
  attackSuccess: boolean;
  passed: boolean;
  auditEvents: AuditEvent[];
  executionTimeMs: number;
}

export interface DualExecutionComparison {
  scenarioId: string;
  baseline: ExecutionResult;
  protected: ExecutionResult;
  divergencePoint?: {
    stepIndex: number;
    description: string;
    actionId: string;
    baselineBehavior: string;
    protectedBehavior: string;
  };
}

export interface EvaluationMetrics {
  totalScenarios: number;
  baselineASR: number; // Attack Success Rate (0-100%)
  protectedASR: number; // Protected ASR (should be 0%)
  attackBlockRate: number; // Protected Block Rate (should be 100% of adversarial)
  falsePositiveRate: number; // Benign cases incorrectly blocked (should be 0%)
  eligibleAdversarialCount: number;
  baselineAttacksSucceededCount: number;
  protectedAttacksBlockedCount: number;
  eligibleBenignCount: number;
  benignIncorrectlyBlockedCount: number;
  sensitiveDataChecked: number;
  sensitiveDataPrevented: number;
  sensitiveDataRedacted: number;
  sensitiveDataLeaked: number;
  sensitiveDataPassRate: number; // (Prevented + Redacted) / Checked
  decisionsCount: {
    ALLOW: number;
    BLOCK: number;
    REDACT: number;
    REVIEW: number;
  };
  categoryBreakdown: Record<
    string,
    {
      total: number;
      baselineCompromised: number;
      protectedBlocked: number;
      safe: number;
    }
  >;
  scenarioResults: {
    scenarioId: string;
    name: string;
    category: ScenarioCategory;
    severity: Severity;
    expectedDecision: PolicyDecision;
    baselineDecision: string;
    protectedDecision: PolicyDecision;
    passed: boolean;
    explanation: string;
  }[];
}

export interface RegressionTestResult {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  expected: string;
  actual: string;
  details: string;
}
