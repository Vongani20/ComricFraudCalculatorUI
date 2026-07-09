export interface SaIdValidationResult {
  valid: boolean;
  message?: string;
}

function luhnCheck(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    let digit = Number(digits[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === Number(digits[12]);
}

function isValidSaDate(yy: number, mm: number, dd: number): boolean {
  const year = yy <= 26 ? 2000 + yy : 1900 + yy;
  const date = new Date(year, mm - 1, dd);
  return (
    date.getFullYear() === year &&
    date.getMonth() === mm - 1 &&
    date.getDate() === dd &&
    date <= new Date()
  );
}

export function validateSaIdNumber(value: string): SaIdValidationResult {
  const id = value.replace(/\s/g, '');
  if (!/^\d{13}$/.test(id)) {
    return { valid: false, message: 'ID number must be exactly 13 digits.' };
  }

  const yy = Number(id.slice(0, 2));
  const mm = Number(id.slice(2, 4));
  const dd = Number(id.slice(4, 6));

  if (!isValidSaDate(yy, mm, dd)) {
    return { valid: false, message: 'Invalid date of birth in ID number.' };
  }

  if (!luhnCheck(id)) {
    return { valid: false, message: 'ID number failed the Luhn checksum.' };
  }

  return { valid: true };
}
