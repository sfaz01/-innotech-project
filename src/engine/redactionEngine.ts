// AgentGuard — Payload Redaction & Transformation Engine
// Recursively inspects tool action parameters and transforms sensitive data spans

import { PIIDetection, ToolAction } from '../types';
import { detectPII, redactPII, DetectionOptions } from './piiDetector';

export interface RedactionResult {
  transformed: any;
  allDetections: PIIDetection[];
  wasModified: boolean;
}

/**
 * Recursively scans and redacts sensitive data from arbitrary values
 */
export function deepRedact(value: any, options?: DetectionOptions): RedactionResult {
  const allDetections: PIIDetection[] = [];
  let wasModified = false;

  function traverse(current: any): any {
    if (typeof current === 'string') {
      const detections = detectPII(current, options);
      if (detections.length > 0) {
        allDetections.push(...detections);
        wasModified = true;
        return redactPII(current, detections);
      }
      return current;
    }

    if (Array.isArray(current)) {
      return current.map(item => traverse(item));
    }

    if (current !== null && typeof current === 'object') {
      const nextObj: Record<string, any> = {};
      for (const [key, val] of Object.entries(current)) {
        nextObj[key] = traverse(val);
      }
      return nextObj;
    }

    return current;
  }

  const transformed = traverse(value);
  return {
    transformed,
    allDetections,
    wasModified,
  };
}

/**
 * Transforms a proposed ToolAction by applying sensitive data redaction to its parameters
 */
export function redactToolAction(
  action: ToolAction,
  options?: DetectionOptions
): { action: ToolAction; detections: PIIDetection[]; modified: boolean } {
  const { transformed, allDetections, wasModified } = deepRedact(action.parameters, options);

  const newAction: ToolAction = {
    ...action,
    parameters: transformed,
    sensitiveSpansFound: allDetections,
  };

  return {
    action: newAction,
    detections: allDetections,
    modified: wasModified,
  };
}
