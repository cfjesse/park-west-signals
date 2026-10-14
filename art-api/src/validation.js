import { badRequest } from './errors.js';

const nonEmptyString = (v) => typeof v === 'string' && v.trim() !== '';
const integerBetween = (min, max) => (v) => Number.isInteger(v) && v >= min && v <= max;

/** Field name -> [validator, message shown when invalid]. Also acts as the editable-column whitelist. */
export const CUSTOMER_RULES = {
  name: [nonEmptyString, 'must be a non-empty string'],
  age: [integerBetween(0, 150), 'must be a whole number between 0 and 150'],
  email: [(v) => nonEmptyString(v) && /^\S+@\S+\.\S+$/.test(v), 'must be a valid email address'],
  phone: [nonEmptyString, 'must be a non-empty string'],
  address: [nonEmptyString, 'must be a non-empty string'],
  credit: [integerBetween(0, Number.MAX_SAFE_INTEGER), 'must be a whole number greater than or equal to 0'],
};

export const ARTIST_RULES = {
  name: [nonEmptyString, 'must be a non-empty string'],
  avatar: [(v) => nonEmptyString(v) && /^https?:\/\/\S+$/.test(v.trim()), 'must be an http(s) URL'],
  bio: [(v) => typeof v === 'string', 'must be a string'],
};

/**
 * Validates a partial update body against a rule set.
 * Returns only the validated editable fields (trimmed strings); throws 400 otherwise.
 * Any key not present in `rules` is rejected.
 */
export function validateUpdate(body, rules) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw badRequest('Request body must be a JSON object');
  }

  const keys = Object.keys(body);
  if (keys.length === 0) {
    throw badRequest('Request body must include at least one field to update');
  }

  const errors = [];
  const fields = {};
  for (const key of keys) {
    const rule = rules[key];
    if (!rule) {
      errors.push(`${key} is read-only or not a recognised field`);
      continue;
    }
    const [isValid, message] = rule;
    if (!isValid(body[key])) {
      errors.push(`${key} ${message}`);
      continue;
    }
    fields[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
  }

  if (errors.length) throw badRequest('Validation failed', errors);
  return fields;
}
