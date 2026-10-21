import { describe, it, expect } from 'vitest';
import {
  createInitialEnvironmentState,
  cloneEnvironmentState,
  executeToolInSandbox,
  diffStates,
} from '../src/engine/executionSandbox';
import { ToolAction } from '../src/types';

describe('Execution Sandbox', () => {
  it('guarantees complete isolation between cloned states', () => {
    const stateA = createInitialEnvironmentState();
    const stateB = cloneEnvironmentState(stateA);

    stateB.outbox.push({
      id: 'EML-1',
      to: 'attacker@evil.com',
      subject: 'Leaked Data',
      body: 'secret',
      timestamp: new Date().toISOString(),
      redacted: false,
    });

    expect(stateA.outbox.length).toBe(0);
    expect(stateB.outbox.length).toBe(1);
  });

  it('executes tools and computes state diff accurately', () => {
    const initialState = createInitialEnvironmentState();

    const paymentAction: ToolAction = {
      id: 'ACT-PAY-1',
      tool: 'ProcessPayment',
      parameters: {
        recipient: 'vendor@okaxis',
        amount: 25000,
        note: 'Cloud hosting',
      },
      timestamp: new Date().toISOString(),
    };

    const out = executeToolInSandbox(initialState, paymentAction);
    expect(out.success).toBe(true);

    const diff = diffStates(initialState, out.state);
    expect(diff.paymentsMade).toBe(1);
    expect(diff.totalAmountPaid).toBe(25000);
    expect(diff.summary.length).toBe(1);
  });
});
