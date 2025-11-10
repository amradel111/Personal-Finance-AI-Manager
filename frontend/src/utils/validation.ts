export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;

export const PASSWORD_REQUIREMENTS: { label: string; test: (value: string) => boolean }[] = [
  { label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { label: 'Includes an uppercase letter', test: (value) => /[A-Z]/.test(value) },
  { label: 'Includes a lowercase letter', test: (value) => /[a-z]/.test(value) },
  { label: 'Includes a number', test: (value) => /\d/.test(value) },
  { label: 'Includes a special character', test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim().toLowerCase());
};

export const isValidPhone = (phone: string): boolean => {
  if (!phone) return false;
  return PHONE_REGEX.test(phone.trim());
};

export const meetsPasswordRequirements = (password: string): boolean => {
  return PASSWORD_REQUIREMENTS.every((requirement) => requirement.test(password));
};

export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong';

export const getPasswordStrength = (password: string): {
  level: PasswordStrengthLevel;
  label: string;
  score: number;
} => {
  if (!password) {
    return { level: 'weak', label: 'Enter a password', score: 0 };
  }

  const score = PASSWORD_REQUIREMENTS.reduce((acc, requirement) => {
    return acc + (requirement.test(password) ? 1 : 0);
  }, 0);

  if (score <= 2) {
    return { level: 'weak', label: 'Weak', score };
  }

  if (score <= 4) {
    return { level: 'medium', label: 'Medium', score };
  }

  return { level: 'strong', label: 'Strong', score };
};
