import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';

// ── Patterns ──────────────────────────────────────────────────────────────
export const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE    = /^(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
export const POSTAL_RE   = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i;
export const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
export const NAME_RE     = /^[\p{L}\s'\-]{2,60}$/u;
export const TRACKING_RE = /^TRK-\d{6}$/;
export const LICENCE_RE  = /^[A-Za-z0-9\-]{5,20}$/;

// ── Individual validators ─────────────────────────────────────────────────
export function emailValidator(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null =>
    !c.value || EMAIL_RE.test(c.value.trim()) ? null : { email: 'Enter a valid email address.' };
}

export function phoneValidator(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null =>
    !c.value || PHONE_RE.test(c.value.trim()) ? null : { phone: 'Enter a valid 10-digit North American number.' };
}

export function postalCodeValidator(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null =>
    !c.value || POSTAL_RE.test(c.value.trim()) ? null : { postalCode: 'Enter a valid Canadian postal code (e.g. K1A 0B1).' };
}

export function passwordStrengthValidator(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    if (!c.value) return null;
    if (c.value.length < 8) return { passwordStrength: 'Password must be at least 8 characters.' };
    if (!/[A-Za-z]/.test(c.value)) return { passwordStrength: 'Password must contain at least one letter.' };
    if (!/\d/.test(c.value)) return { passwordStrength: 'Password must contain at least one digit.' };
    return null;
  };
}

export function nameValidator(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    if (!c.value) return null;
    const v = c.value.trim();
    if (v.length < 2)  return { name: 'Name must be at least 2 characters.' };
    if (v.length > 60) return { name: 'Name must be at most 60 characters.' };
    // Match backend: letters (with accents), spaces, hyphens, apostrophes
    if (!/^[\p{L}\s'\-]+$/u.test(v)) return { name: "Name may only contain letters, spaces, hyphens and apostrophes." };
    return null;
  };
}

export function trackingNumberValidator(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null =>
    !c.value || TRACKING_RE.test(c.value.trim()) ? null : { trackingNumber: 'Enter a valid tracking number (TRK-XXXXXX).' };
}

export function licenceValidator(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null =>
    !c.value || LICENCE_RE.test(c.value.trim()) ? null : { licence: 'Licence must be 5–20 alphanumeric characters.' };
}

/** Parcel weight: 0.1 – 50 kg */
export function weightValidator(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    if (c.value === null || c.value === '') return null;
    const v = Number(c.value);
    if (isNaN(v) || v < 0.1) return { weight: 'Weight must be at least 0.1 kg.' };
    if (v > 50) return { weight: 'Weight must be at most 50 kg.' };
    return null;
  };
}

/** Declared value: 0 – 10000 CAD */
export function declaredValueValidator(): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    if (c.value === null || c.value === '' || c.value === undefined) return null;
    const v = Number(c.value);
    if (isNaN(v) || v < 0) return { declaredValue: 'Declared value must be 0 or more.' };
    if (v > 10000) return { declaredValue: 'Declared value must be at most $10,000 CAD.' };
    return null;
  };
}

/** Cross-field: confirmPassword must match password */
export function passwordsMatchValidator(passwordKey = 'password', confirmKey = 'confirmPassword'): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const pw  = (group as FormGroup).get(passwordKey)?.value;
    const cpw = (group as FormGroup).get(confirmKey)?.value;
    if (!pw || !cpw) return null;
    return pw === cpw ? null : { passwordsMismatch: 'Passwords do not match.' };
  };
}

// ── Helper: get first error message from a control ───────────────────────
export function getError(control: AbstractControl | null): string {
  if (!control || !control.errors) return '';
  const errors = control.errors;
  // Custom string messages stored directly on the key
  for (const key of Object.keys(errors)) {
    if (typeof errors[key] === 'string') return errors[key];
  }
  // Angular built-in messages
  if (errors['required'])  return 'This field is required.';
  if (errors['minlength'])  return `Minimum ${errors['minlength'].requiredLength} characters.`;
  if (errors['maxlength'])  return `Maximum ${errors['maxlength'].requiredLength} characters.`;
  if (errors['min'])        return `Minimum value is ${errors['min'].min}.`;
  if (errors['max'])        return `Maximum value is ${errors['max'].max}.`;
  if (errors['email'])      return 'Enter a valid email address.';
  if (errors['pattern'])    return 'Invalid format.';
  return 'Invalid value.';
}

/** Focus the first invalid element in a native form element */
export function focusFirstInvalid(formEl: HTMLElement): void {
  const invalid = formEl.querySelector<HTMLElement>(
    'input.ng-invalid, select.ng-invalid, textarea.ng-invalid, [aria-invalid="true"]'
  );
  invalid?.focus();
}
