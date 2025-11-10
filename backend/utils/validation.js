'use strict';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;

/**
 * Validate email format (simple RFC 5322-inspired check)
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return EMAIL_REGEX.test(normalized);
};

/**
 * Ensure password meets minimum strength requirements
 * - At least 8 characters
 * - Contains uppercase, lowercase, number, and special character
 * @param {string} password
 * @returns {boolean}
 */
const isStrongPassword = (password) => {
  if (typeof password !== 'string') return false;
  const value = password;

  if (value.length < 8) return false;
  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);

  return hasUppercase && hasLowercase && hasNumber && hasSpecial;
};

/**
 * Trim string input and ensure non-empty result
 * @param {string} value
 * @returns {string}
 */
const sanitizeName = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

module.exports = {
  isValidEmail,
  isStrongPassword,
  sanitizeName,
  isValidPhone: (phone) => {
    if (typeof phone !== 'string') return false;
    const normalized = phone.trim();
    if (!normalized) return false;
    return PHONE_REGEX.test(normalized);
  },
};
