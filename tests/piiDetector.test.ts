import { describe, it, expect } from 'vitest';
import { detectPII, redactPII, isSyntheticAadhaar, isSyntheticPAN } from '../src/engine/piiDetector';

describe('India PII & Identifier Detector', () => {
  it('detects 12-digit synthetic Aadhaar format correctly', () => {
    expect(isSyntheticAadhaar('2345 6789 0123')).toBe(true);
    expect(isSyntheticAadhaar('0123 4567 8901')).toBe(false); // starts with 0
    expect(isSyntheticAadhaar('12345')).toBe(false); // not 12 digits

    const text = 'Customer KYC submitted with synthetic Aadhaar: 2345 6789 0123 for profile verification.';
    const detections = detectPII(text);
    expect(detections.length).toBe(1);
    expect(detections[0].category).toBe('AADHAAR');
    expect(detections[0].raw).toBe('2345 6789 0123');
    expect(detections[0].masked).toContain('XXXX-XXXX-0123');
  });

  it('detects synthetic PAN identifiers and entity types', () => {
    const panCheck = isSyntheticPAN('ABCCE1234F');
    expect(panCheck.valid).toBe(true);
    expect(panCheck.entityType).toContain('Company');

    const indPan = isSyntheticPAN('BNZPP5432K');
    expect(indPan.valid).toBe(true);
    expect(indPan.entityType).toContain('Individual');

    const detections = detectPII('Tax inquiry with PAN ABCDE1234F.');
    expect(detections.length).toBe(1);
    expect(detections[0].category).toBe('PAN');
    expect(detections[0].raw).toBe('ABCDE1234F');
  });

  it('detects Indian phone numbers and UPI IDs', () => {
    const text = 'Please reach me on +91 98765 43210 or transfer ₹500 via UPI: satyam@okaxis.';
    const detections = detectPII(text);
    const categories = detections.map(d => d.category);

    expect(categories).toContain('PHONE');
    expect(categories).toContain('UPI');
  });

  it('safely redacts sensitive spans without corrupting text', () => {
    const text = 'Customer Sunita (Aadhaar: 2345 6789 0123, Phone: +91 98765 43210) verified.';
    const detections = detectPII(text);
    const redacted = redactPII(text, detections);

    expect(redacted).not.toContain('2345 6789 0123');
    expect(redacted).not.toContain('+91 98765 43210');
    expect(redacted).toContain('[Aadhaar Masked');
    expect(redacted).toContain('[Phone Number Masked');
  });
});
