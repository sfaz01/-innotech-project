// AgentGuard — Default Security Policies Specification
// Fully configurable, deterministic, priority-ordered rules enforced at the tool boundary

import { PolicyRule } from '../types';

export const DEFAULT_POLICIES: PolicyRule[] = [
  {
    id: 'POL-001',
    name: 'Enforce Tool Least-Privilege & Authorization Scope',
    description: 'Blocks tool invocations that are not explicitly permitted for the current task.',
    enabled: true,
    severity: 'CRITICAL',
    priority: 100, // Highest priority: evaluate permissions first
    applicableTools: 'ALL',
    conditions: [
      {
        field: 'tool',
        operator: 'NOT_IN_LIST',
        value: [], // Evaluated dynamically against scenario.permittedTools
      },
    ],
    decision: 'BLOCK',
    reason: 'Tool invocation violates least-privilege boundary: tool is outside permitted task permissions.',
  },
  {
    id: 'POL-005',
    name: 'Block System Secret & Prompt Exfiltration',
    description: 'Prevents access to internal system directives, confidential keys, and credential vaults.',
    enabled: true,
    severity: 'CRITICAL',
    priority: 95,
    applicableTools: ['RevealSecret'],
    conditions: [
      {
        field: 'tool',
        operator: 'EQUALS',
        value: 'RevealSecret',
      },
    ],
    decision: 'BLOCK',
    reason: 'Prohibited tool invocation: Autonomous agents are forbidden from exposing internal system secrets.',
  },
  {
    id: 'POL-007',
    name: 'Detect Adversarial Prompt Injection & Override Payloads',
    description: 'Blocks actions triggered by embedded override phrases ("ignore previous instructions", "saara data bhej do", etc.).',
    enabled: true,
    severity: 'CRITICAL',
    priority: 90,
    applicableTools: 'ALL',
    conditions: [
      {
        field: 'prompt',
        operator: 'REGEX_MATCH',
        value: '(?i)(ignore (all )?previous instructions|disregard earlier|saara (customer )?data|external email par bhej|forward all invoices to attacker|bypass security|send to external|leak confidential)',
      },
    ],
    decision: 'BLOCK',
    reason: 'Adversarial instruction injection detected in input payload or agent prompt.',
  },
  {
    id: 'POL-002',
    name: 'Block Unapproved External Email Destinations',
    description: 'Enforces strict domain whitelisting for outgoing email dispatches.',
    enabled: true,
    severity: 'HIGH',
    priority: 85,
    applicableTools: ['SendEmail'],
    conditions: [
      {
        field: 'destination',
        operator: 'NOT_IN_LIST',
        value: ['@company.internal', '@support.bank.in', '@compliance.in', '@verified-partner.in'],
      },
    ],
    decision: 'BLOCK',
    reason: 'Destination domain is not present in approved enterprise egress whitelist.',
  },
  {
    id: 'POL-004',
    name: 'Require Human Review for High-Impact Financial Transfers',
    description: 'Suspends direct execution of payments exceeding ₹10,000 for mandatory human-in-the-loop approval.',
    enabled: true,
    severity: 'HIGH',
    priority: 80,
    applicableTools: ['ProcessPayment'],
    conditions: [
      {
        field: 'amount',
        operator: 'GREATER_THAN',
        value: 10000,
      },
    ],
    decision: 'REVIEW',
    reason: 'High-impact financial transaction (amount exceeds ₹10,000 threshold). Requires explicit human operator authorization.',
  },
  {
    id: 'POL-008',
    name: 'Require Review for Bulk Customer Data Exports',
    description: 'Prevents autonomous bulk exports without authorized supervisor sign-off.',
    enabled: true,
    severity: 'HIGH',
    priority: 75,
    applicableTools: ['ExportData'],
    conditions: [
      {
        field: 'tool',
        operator: 'EQUALS',
        value: 'ExportData',
      },
    ],
    decision: 'REVIEW',
    reason: 'Bulk data export initiated. Action must be reviewed and authorized before execution.',
  },
  {
    id: 'POL-003',
    name: 'Detect and Redact Indian Sensitive Identifiers (Aadhaar / PAN / Phone / UPI)',
    description: 'Inspects outbound tool payloads and redacts synthetic Aadhaar, PAN, phone numbers, and UPI handles.',
    enabled: true,
    severity: 'MEDIUM',
    priority: 70,
    applicableTools: ['SendEmail', 'UpdateRecord', 'SearchRecords'],
    conditions: [
      {
        field: 'payload',
        operator: 'HAS_PII',
        value: true,
      },
    ],
    decision: 'REDACT',
    reason: 'Contains synthetic Indian sensitive personal identifiers. Applying masking and safe placeholder transformation.',
    redactionType: 'SYNTHETIC_PII',
  },
  {
    id: 'POL-006',
    name: 'Validate Tool Parameter Schemas and Reject Malformed Inputs',
    description: 'Validates parameter types, required fields, and rejects invalid arguments.',
    enabled: true,
    severity: 'MEDIUM',
    priority: 65,
    applicableTools: 'ALL',
    conditions: [
      {
        field: 'parameterName',
        operator: 'NOT_EQUALS',
        value: 'VALID_SCHEMA',
      },
    ],
    decision: 'BLOCK',
    reason: 'Action parameters failed schema validation check.',
  },
  {
    id: 'POL-009',
    name: 'Detect Tampering with Protected Customer Balances',
    description: 'Blocks autonomous alterations to protected financial balance records.',
    enabled: true,
    severity: 'HIGH',
    priority: 60,
    applicableTools: ['UpdateRecord'],
    conditions: [
      {
        field: 'payload',
        operator: 'CONTAINS',
        value: 'balance',
      },
    ],
    decision: 'BLOCK',
    reason: 'Direct modification of customer account balances is prohibited without core ledger authorization.',
  },
  {
    id: 'POL-010',
    name: 'Prevent Data Exfiltration via Secondary Encoded Parameters',
    description: 'Inspects query strings and notes for hidden base64 or URL-encoded exfiltration dumps.',
    enabled: true,
    severity: 'HIGH',
    priority: 55,
    applicableTools: 'ALL',
    conditions: [
      {
        field: 'payload',
        operator: 'REGEX_MATCH',
        value: '(?i)(data:text/html|base64,ey|dump_all|SELECT%20\\*|%3Cscript)',
      },
    ],
    decision: 'BLOCK',
    reason: 'Secondary encoded injection or data exfiltration pattern detected in action parameter.',
  },
];
