import { Pipe, PipeTransform } from '@angular/core';

/** Format a number as Canadian dollars: $1,234.56 */
@Pipe({ name: 'cad', standalone: true, pure: true })
export class CadPipe implements PipeTransform {
  private static readonly fmt = new Intl.NumberFormat('en-CA', {
    style: 'currency', currency: 'CAD', minimumFractionDigits: 2, maximumFractionDigits: 2
  });
  transform(value: number | null | undefined): string {
    if (value == null) return '$0.00';
    return CadPipe.fmt.format(Number(value));
  }
}

/** Format a Date or ISO string in en-CA / America/Toronto */
export function fmtDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(value));
}

/** Format a phone number as (613) 555-0100 */
export function fmtPhone(raw: string | null | undefined): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  const d = digits.length === 11 && digits[0] === '1' ? digits.slice(1) : digits;
  if (d.length !== 10) return raw;
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
}
