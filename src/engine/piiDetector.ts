// AgentGuard — India-Focused Sensitive Data & Identifier Detector
// Notice: All detections operate on synthetic simulation patterns.
// No real citizen, financial, or personal data is processed or authentic.

import { PIICategory, PIIDetection } from '../types';

export interface DetectionOptions {
  detectAadhaar?: boolean;
  detectPAN?: boolean;
  detectPhone?: boolean;
  detectEmail?: boolean;
  detectUPI?: boolean;
  ignoredEmails?: string[];
  customPatterns?: { id: string; name: string; pattern: string; placeholder: string }[];
}

const DEFAULT_OPTIONS: DetectionOptions = {
  detectAadhaar: true,
  detectPAN: true,
  detectPhone: true,
  detectEmail: true,
  detectUPI: true,
  ignoredEmails: [],
  customPatterns: [],
};

// Indian PAN 4th character entity categories
export const PAN_ENTITY_TYPES: Record<string, string> = {
  P: 'Individual / Person',
  C: 'Company',
  H: 'Hindu Undivided Family',
  F: 'Partnership Firm',
  A: 'Association of Persons',
  T: 'Trust',
  B: 'Body of Individuals',
  L: 'Local Authority',
  J: 'Artificial Juridical Person',
  G: 'Government Agency',
  D: 'Department / Organization',
};

// Common Indian UPI PSP handles
export const COMMON_UPI_HANDLES = new Set([
  'okaxis',
  'oksbi',
  'okhdfcbank',
  'okicici',
  'paytm',
  'ybl',
  'ibl',
  'apl',
  'axl',
  'upi',
  'idfcbank',
  'kotak',
  'icici',
  'barodampay',
  'federal',
  'sbi',
]);

/**
 * Validates whether an extracted string matches Aadhaar-like 12-digit boundary rules
 */
export function isSyntheticAadhaar(raw: string): boolean {
  const clean = raw.replace(/\s+/g, '');
  if (!/^\d{12}$/.test(clean)) return false;
  // Aadhaar numbers don't start with 0 or 1
  if (clean.startsWith('0') || clean.startsWith('1')) return false;
  return true;
}

/**
 * Validates whether an extracted string matches Indian PAN format
 */
export function isSyntheticPAN(raw: string): { valid: boolean; entityType?: string } {
  const clean = raw.toUpperCase().trim();
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(clean)) {
    return { valid: false };
  }
  const fourthChar = clean[3];
  return {
    valid: true,
    entityType: PAN_ENTITY_TYPES[fourthChar] || 'Standard Entity',
  };
}

/**
 * Scans text for Indian sensitive data identifiers (synthetic simulation)
 */
export function detectPII(text: string, options: DetectionOptions = DEFAULT_OPTIONS): PIIDetection[] {
  if (!text || typeof text !== 'string') return [];

  const detections: PIIDetection[] = [];
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const ignoredEmailsSet = new Set((mergedOptions.ignoredEmails || []).map(e => e.toLowerCase()));

  // 1. Synthetic Aadhaar-like 12-digit pattern: "2345 6789 0123" or "234567890123"
  if (mergedOptions.detectAadhaar) {
    const aadhaarRegex = /(?<!\d)(?:([2-9]\d{3})\s([0-9]{4})\s([0-9]{4})|([2-9]\d{11}))(?!\d)/g;
    let match: RegExpExecArray | null;
    while ((match = aadhaarRegex.exec(text)) !== null) {
      const raw = match[0];
      const cleanDigits = raw.replace(/\s+/g, '');
      if (cleanDigits.length === 12) {
        const last4 = cleanDigits.slice(-4);
        detections.push({
          id: `pii-aadhaar-${match.index}`,
          category: 'AADHAAR',
          raw,
          masked: `[Aadhaar Masked: XXXX-XXXX-${last4}]`,
          start: match.index,
          end: match.index + raw.length,
          confidence: 0.95,
          explanation: 'Detected 12-digit synthetic Aadhaar-like number matching Indian UIDAI formatting structure.',
        });
      }
    }
  }

  // 2. Synthetic PAN-like pattern: 5 uppercase letters, 4 digits, 1 uppercase letter
  if (mergedOptions.detectPAN) {
    const panRegex = /(?<![A-Za-z0-9])([A-Z]{5}[0-9]{4}[A-Z]{1})(?![A-Za-z0-9])/g;
    let match: RegExpExecArray | null;
    while ((match = panRegex.exec(text)) !== null) {
      const raw = match[1];
      const validation = isSyntheticPAN(raw);
      if (validation.valid) {
        const first2 = raw.slice(0, 2);
        const last1 = raw.slice(-1);
        detections.push({
          id: `pii-pan-${match.index}`,
          category: 'PAN',
          raw,
          masked: `[PAN Redacted: ${first2}XXXXXX${last1}]`,
          start: match.index,
          end: match.index + raw.length,
          confidence: 0.98,
          explanation: `Detected synthetic Permanent Account Number (PAN). Entity category: ${validation.entityType}.`,
        });
      }
    }
  }

  // 3. Indian Phone Numbers (+91 / 0 / 10 digits starting with 6-9)
  if (mergedOptions.detectPhone) {
    const phoneRegex = /(?<!\d)(?:(?:\+91[\-\s]?|91[\-\s]?|0)?[6-9]\d{4}[\-\s]?\d{5})(?!\d)/g;
    let match: RegExpExecArray | null;
    while ((match = phoneRegex.exec(text)) !== null) {
      const raw = match[0];
      const overlaps = detections.some(d => d.category === 'AADHAAR' && match!.index >= d.start && match!.index < d.end);
      if (!overlaps) {
        const digits = raw.replace(/\D/g, '');
        const last4 = digits.slice(-4);
        detections.push({
          id: `pii-phone-${match.index}`,
          category: 'PHONE',
          raw,
          masked: `[Phone Number Masked: +91-XXXXX-${last4}]`,
          start: match.index,
          end: match.index + raw.length,
          confidence: 0.92,
          explanation: 'Detected Indian telecom mobile number (+91 / 10-digit format starting with 6-9).',
        });
      }
    }
  }

  // 4. UPI Identifiers (Virtual Payment Address)
  if (mergedOptions.detectUPI) {
    const upiRegex = /(?<![a-zA-Z0-9.\-_])([a-zA-Z0-9.\-_]{2,64}@([a-zA-Z]{2,32}))\b/g;
    let match: RegExpExecArray | null;
    while ((match = upiRegex.exec(text)) !== null) {
      const raw = match[1];
      const handle = match[2].toLowerCase();

      const isKnownHandle = COMMON_UPI_HANDLES.has(handle);
      const isEmailTLD = /^(com|net|org|edu|gov|io|co|in|ai|xyz)$/i.test(handle);

      if (isKnownHandle || (!isEmailTLD && (text.toLowerCase().includes('upi') || text.toLowerCase().includes('pay') || text.toLowerCase().includes('rupee')))) {
        detections.push({
          id: `pii-upi-${match.index}`,
          category: 'UPI',
          raw,
          masked: `[UPI ID Redacted: ***@${handle}]`,
          start: match.index,
          end: match.index + raw.length,
          confidence: isKnownHandle ? 0.96 : 0.82,
          explanation: `Detected Unified Payments Interface (UPI) VPA identifier on handle @${handle}.`,
        });
      }
    }
  }

  // 5. Email Addresses
  if (mergedOptions.detectEmail) {
    const emailRegex = /(?<![a-zA-Z0-9._%+-])([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g;
    let match: RegExpExecArray | null;
    while ((match = emailRegex.exec(text)) !== null) {
      const raw = match[1];
      if (ignoredEmailsSet.has(raw.toLowerCase())) continue;

      const isUPI = detections.some(d => d.category === 'UPI' && match!.index >= d.start && match!.index < d.end);
      if (!isUPI) {
        const [username, domain] = raw.split('@');
        const maskedUser = username.length > 2 ? `${username[0]}***${username[username.length - 1]}` : '***';
        detections.push({
          id: `pii-email-${match.index}`,
          category: 'EMAIL',
          raw,
          masked: `[Email Redacted: ${maskedUser}@${domain}]`,
          start: match.index,
          end: match.index + raw.length,
          confidence: 0.95,
          explanation: 'Detected electronic mail address.',
        });
      }
    }
  }

  // 6. Custom Patterns
  if (mergedOptions.customPatterns && mergedOptions.customPatterns.length > 0) {
    for (const custom of mergedOptions.customPatterns) {
      try {
        const regex = new RegExp(custom.pattern, 'g');
        let match: RegExpExecArray | null;
        while ((match = regex.exec(text)) !== null) {
          detections.push({
            id: `pii-custom-${match.index}`,
            category: 'CUSTOM',
            raw: match[0],
            masked: custom.placeholder || '[Custom Sensitive Data Redacted]',
            start: match.index,
            end: match.index + match[0].length,
            confidence: 0.9,
            explanation: `Matched user-defined sensitive data pattern: ${custom.name}`,
          });
        }
      } catch (err) {
        console.warn(`Invalid custom regex pattern: ${custom.pattern}`, err);
      }
    }
  }

  return detections.sort((a, b) => a.start - b.start);
}

/**
 * Replaces detected sensitive data spans with readable masking tokens
 */
export function redactPII(text: string, detections: PIIDetection[]): string {
  if (!text || detections.length === 0) return text;

  const sorted = [...detections].sort((a, b) => b.start - a.start);
  let result = text;

  for (const item of sorted) {
    result = result.slice(0, item.start) + item.masked + result.slice(item.end);
  }

  return result;
}
