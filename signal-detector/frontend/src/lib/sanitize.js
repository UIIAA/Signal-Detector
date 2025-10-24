import DOMPurify from 'isomorphic-dompurify';

// Configure DOMPurify for server-side use
if (typeof window === 'undefined') {
  // Server-side setup
  const { JSDOM } = require('jsdom');
  const window = new JSDOM('').window;
  DOMPurify(window);
}

/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string|object|array} input - The input to sanitize
 * @returns {string|object|array} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Basic sanitization for strings
    return DOMPurify.sanitize(input);
  } else if (typeof input === 'object' && input !== null) {
    if (Array.isArray(input)) {
      // Sanitize array elements
      return input.map(item => sanitizeInput(item));
    } else {
      // Sanitize object properties
      const sanitizedObject = {};
      for (const [key, value] of Object.entries(input)) {
        sanitizedObject[key] = sanitizeInput(value);
      }
      return sanitizedObject;
    }
  }
  // Return primitive values as-is
  return input;
};

/**
 * Sanitizes a specific field in an object
 * @param {object} obj - The object containing the field to sanitize
 * @param {string} field - The field name to sanitize
 * @returns {object} - Object with sanitized field
 */
export const sanitizeField = (obj, field) => {
  if (obj && typeof obj === 'object' && obj.hasOwnProperty(field)) {
    return {
      ...obj,
      [field]: sanitizeInput(obj[field])
    };
  }
  return obj;
};

/**
 * Sanitizes multiple fields in an object
 * @param {object} obj - The object to sanitize
 * @param {string[]} fields - Array of field names to sanitize
 * @returns {object} - Object with sanitized fields
 */
export const sanitizeFields = (obj, fields) => {
  let sanitizedObj = { ...obj };
  for (const field of fields) {
    if (sanitizedObj && typeof sanitizedObj === 'object' && sanitizedObj.hasOwnProperty(field)) {
      sanitizedObj = {
        ...sanitizedObj,
        [field]: sanitizeInput(sanitizedObj[field])
      };
    }
  }
  return sanitizedObj;
};

/**
 * Sanitizes all string values in an object recursively
 * @param {object} obj - The object to recursively sanitize
 * @returns {object} - Recursively sanitized object
 */
export const sanitizeObjectRecursively = (obj) => {
  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectRecursively(item));
  } else if (obj !== null && typeof obj === 'object') {
    const sanitizedObj = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitizedObj[key] = sanitizeObjectRecursively(value);
    }
    return sanitizedObj;
  }
  return obj;
};