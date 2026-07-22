export const templates: Record<string, string> = {
  FIELD_REQUIRED: '{field} is required',
  INVALID_EMAIL: '{field} must be a valid email address',
  INVALID_URL: '{field} must be a valid URL',
  INVALID_ENUM: '{field} must be one of {values}',
  INVALID_NUMBER: '{field} must be a number',
  INVALID_DATE: '{field} must be a valid date',
  MIN_LENGTH: '{field} must be at least {min} characters',
  MAX_LENGTH: '{field} must be at most {max} characters',
  INVALID_FORMAT: '{field} has invalid format',
};

export const validationErrorMessages: Record<string, Record<string, string>> = {
  emailId: {
    invalid: "Invalid email format",
    required: "Email ID is required",
  },
  confidenceScore: {
    min: "Confidence score must be at least 0",
    max: "Confidence score cannot exceed 1",
  },
  endpointUrl: {
    invalid: "Invalid URL format",
    required: "Endpoint URL is required",
  },
};

/**
 * Maps message templates to custom user-friendly error messages based on validation context parameters.
 */
export function getErrorMessage(
  fieldOrCode: string,
  errorTypeOrContext: any,
  _context?: any
): string {
  // If the second parameter is a string, we are using the new signature: (field, errorType, context)
  if (typeof errorTypeOrContext === 'string') {
    const fieldMessages = validationErrorMessages[fieldOrCode];
    if (fieldMessages && fieldMessages[errorTypeOrContext]) {
      return fieldMessages[errorTypeOrContext];
    }
    return `${fieldOrCode} has invalid ${errorTypeOrContext} validation status`;
  }

  // Fallback to legacy signature: (code, context)
  const template = templates[fieldOrCode];
  if (!template) {
    return 'Invalid parameter field value';
  }

  let message = template;
  const ctx = errorTypeOrContext || {};
  if (ctx.field !== undefined) {
    message = message.replace('{field}', ctx.field);
  }
  if (ctx.min !== undefined) {
    message = message.replace('{min}', String(ctx.min));
  }
  if (ctx.max !== undefined) {
    message = message.replace('{max}', String(ctx.max));
  }
  if (ctx.values !== undefined) {
    message = message.replace('{values}', `[${ctx.values.join(', ')}]`);
  }

  return message;
}
