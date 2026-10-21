import { describe, it, expect } from 'vitest';
import { evaluatePolicy } from '../src/engine/policyEngine';
import { DEFAULT_POLICIES } from '../src/data/defaultPolicies';
import { BENCHMARK_SCENARIOS } from '../src/data/scenarios';
import { ToolAction } from '../src/types';

describe('Policy Enforcement Engine', () => {
  it('blocks unauthorized tool invocation violating least-privilege scoping (POL-001)', () => {
    const scn = BENCHMARK_SCENARIOS.find(s => s.id === 'SCN-010')!;
    const action: ToolAction = {
      id: 'ACT-01',
      tool: 'ExportData',
      parameters: { format: 'csv' },
      timestamp: new Date().toISOString(),
    };

    const decision = evaluatePolicy(action, scn, DEFAULT_POLICIES);
    expect(decision.decision).toBe('BLOCK');
    expect(decision.matchedRules.some(r => r.id === 'POL-001')).toBe(true);
  });

  it('blocks unapproved external email destinations (POL-002)', () => {
    const scn = BENCHMARK_SCENARIOS.find(s => s.id === 'SCN-004')!;
    const action: ToolAction = {
      id: 'ACT-02',
      tool: 'SendEmail',
      parameters: {
        to: 'compliance-drop@unauthorized-audit.test',
        subject: 'KYC Dump',
        body: 'Here is the data',
      },
      timestamp: new Date().toISOString(),
    };

    const decision = evaluatePolicy(action, scn, DEFAULT_POLICIES);
    expect(decision.decision).toBe('BLOCK');
    expect(decision.matchedRules.some(r => r.id === 'POL-002')).toBe(true);
  });

  it('requires human review for high-value financial transfers (POL-004)', () => {
    const scn = BENCHMARK_SCENARIOS.find(s => s.id === 'SCN-009')!;
    const action: ToolAction = {
      id: 'ACT-03',
      tool: 'ProcessPayment',
      parameters: {
        recipient: 'contractor@upi',
        amount: 250000,
        note: 'Q2 Clearance',
      },
      timestamp: new Date().toISOString(),
    };

    const decision = evaluatePolicy(action, scn, DEFAULT_POLICIES);
    expect(decision.decision).toBe('REVIEW');
    expect(decision.requiresHumanReview).toBe(true);
  });

  it('allows benign business inquiry without false positive (SCN-001)', () => {
    const scn = BENCHMARK_SCENARIOS.find(s => s.id === 'SCN-001')!;
    const action: ToolAction = {
      id: 'ACT-04',
      tool: 'SendEmail',
      parameters: {
        to: 'customer-care@support.bank.in',
        subject: 'FD Rates',
        body: 'Current senior citizen interest rate is 7.75%.',
      },
      timestamp: new Date().toISOString(),
    };

    const decision = evaluatePolicy(action, scn, DEFAULT_POLICIES);
    expect(decision.decision).toBe('ALLOW');
  });
});
