// AgentGuard — Tool Registry & Schema Validator
// Defines available mock tools, schemas, impact levels, and authorization bounds

import { ToolDefinition, ToolName, ToolAction } from '../types';

export const TOOL_DEFINITIONS: Record<ToolName, ToolDefinition> = {
  ReadDocument: {
    name: 'ReadDocument',
    description: 'Reads an internal document, customer ticket, or uploaded file.',
    isHighImpact: false,
    requiresReviewByDefault: false,
    parameters: [
      { name: 'documentId', type: 'string', required: true, description: 'Identifier of the document to inspect.' },
      { name: 'query', type: 'string', required: false, description: 'Optional search filter within document.' },
    ],
  },
  SearchRecords: {
    name: 'SearchRecords',
    description: 'Searches internal customer records and databases.',
    isHighImpact: false,
    requiresReviewByDefault: false,
    parameters: [
      { name: 'query', type: 'string', required: true, description: 'Search keywords or customer identifiers.' },
      { name: 'category', type: 'string', required: false, description: 'Record category (e.g., kyc, billing).' },
    ],
  },
  SendEmail: {
    name: 'SendEmail',
    description: 'Dispatches an email notification or response.',
    isHighImpact: false,
    requiresReviewByDefault: false,
    parameters: [
      { name: 'to', type: 'string', required: true, description: 'Recipient email address.' },
      { name: 'subject', type: 'string', required: true, description: 'Subject line of the email.' },
      { name: 'body', type: 'string', required: true, description: 'Body text content of the message.' },
    ],
    allowedDestinations: ['@company.internal', '@support.bank.in', '@compliance.in'],
  },
  ExportData: {
    name: 'ExportData',
    description: 'Exports customer or transaction records in bulk.',
    isHighImpact: true,
    requiresReviewByDefault: true,
    parameters: [
      { name: 'format', type: 'string', required: true, description: 'Export format: csv, json, or pdf.' },
      { name: 'filter', type: 'string', required: false, description: 'Export selection filter query.' },
      { name: 'destination', type: 'string', required: false, description: 'External download or storage location.' },
    ],
  },
  ProcessPayment: {
    name: 'ProcessPayment',
    description: 'Initiates a financial transfer or UPI payout.',
    isHighImpact: true,
    requiresReviewByDefault: true,
    parameters: [
      { name: 'recipient', type: 'string', required: true, description: 'UPI VPA or beneficiary account.' },
      { name: 'amount', type: 'number', required: true, description: 'Transfer amount in INR (₹).' },
      { name: 'note', type: 'string', required: false, description: 'Transfer description or payment purpose.' },
    ],
  },
  UpdateRecord: {
    name: 'UpdateRecord',
    description: 'Updates a customer or transaction record in the internal database.',
    isHighImpact: false,
    requiresReviewByDefault: false,
    parameters: [
      { name: 'recordId', type: 'string', required: true, description: 'Target record ID.' },
      { name: 'fields', type: 'object', required: true, description: 'Key-value map of fields to update.' },
    ],
  },
  RevealSecret: {
    name: 'RevealSecret',
    description: 'Requests system prompt instructions or internal API credentials.',
    isHighImpact: true,
    requiresReviewByDefault: true,
    parameters: [
      { name: 'secretKey', type: 'string', required: true, description: 'Secret identifier to access.' },
    ],
  },
};

export interface ParameterValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates tool parameters against the registered schema
 */
export function validateToolParameters(action: ToolAction): ParameterValidationResult {
  const toolDef = TOOL_DEFINITIONS[action.tool];
  if (!toolDef) {
    return {
      valid: false,
      errors: [`Tool '${action.tool}' is not recognized in the registry.`],
    };
  }

  const errors: string[] = [];
  const params = action.parameters || {};

  for (const param of toolDef.parameters) {
    const val = params[param.name];
    if (param.required && (val === undefined || val === null || val === '')) {
      errors.push(`Missing required parameter '${param.name}' for tool '${action.tool}'.`);
      continue;
    }

    if (val !== undefined && val !== null) {
      if (param.type === 'number') {
        const num = Number(val);
        if (isNaN(num)) {
          errors.push(`Parameter '${param.name}' must be a number, got '${typeof val}'.`);
        }
      } else if (param.type === 'object') {
        if (typeof val !== 'object' || Array.isArray(val)) {
          errors.push(`Parameter '${param.name}' must be an object.`);
        }
      } else if (param.type === 'array') {
        if (!Array.isArray(val)) {
          errors.push(`Parameter '${param.name}' must be an array.`);
        }
      } else if (typeof val !== param.type) {
        errors.push(`Parameter '${param.name}' expected type '${param.type}', got '${typeof val}'.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
