import { describe, it, expect } from 'vitest';
import { deepRedact, redactToolAction } from '../src/engine/redactionEngine';
import { ToolAction } from '../src/types';

describe('Redaction & Transformation Engine', () => {
  it('deeply traverses nested objects and arrays to redact synthetic PII', () => {
    const payload = {
      customer: {
        name: 'Aarav',
        aadhaar: '2345 6789 0123',
        contacts: ['+91 98201 94820', 'backup@test.in'],
      },
      tags: ['kyc', 'verified'],
    };

    const { transformed, allDetections, wasModified } = deepRedact(payload);
    expect(wasModified).toBe(true);
    expect(allDetections.length).toBe(3);
    expect(transformed.customer.aadhaar).toContain('[Aadhaar Masked');
    expect(transformed.customer.contacts[0]).toContain('[Phone Number Masked');
    expect(transformed.customer.name).toBe('Aarav');
    expect(transformed.tags).toEqual(['kyc', 'verified']);
  });

  it('redacts ToolAction parameters and stores sensitiveSpansFound', () => {
    const action: ToolAction = {
      id: 'ACT-01',
      tool: 'UpdateRecord',
      parameters: {
        recordId: 'CUST-101',
        fields: {
          note: 'Synthetic PAN is ABCDE1234F',
        },
      },
      timestamp: new Date().toISOString(),
    };

    const { action: transformedAction, detections } = redactToolAction(action);
    expect(detections.length).toBe(1);
    expect(transformedAction.parameters.fields.note).toContain('[PAN Redacted');
    expect(transformedAction.sensitiveSpansFound?.length).toBe(1);
  });
});
