/**
 * Formats any ISO or date string into DD-MM-YYYY format (e.g. 28-09-2026).
 */
export function formatDateDDMMYYYY(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';

  const str = String(dateInput).trim();
  // If already DD-MM-YYYY e.g. 28-09-2026 (or MM-DD-YYYY where day/month format matches)
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    const [p1, p2, yyyy] = str.split('-');
    const num1 = Number(p1);
    const num2 = Number(p2);
    // If first number > 12, it must be DD-MM-YYYY already
    if (num1 > 12) {
      return str;
    }
    // If second number > 12, it was MM-DD-YYYY
    if (num2 > 12) {
      return `${p2}-${p1}-${yyyy}`;
    }
    // Otherwise assume DD-MM-YYYY
    return str;
  }

  // If YYYY-MM-DD e.g. 2026-09-28
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [yyyy, mm, dd] = str.split('-');
    return `${dd}-${mm}-${yyyy}`;
  }

  // Parse with Date object
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;

  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
}

// Alias for backwards compatibility if needed
export const formatDateMMDDYYYY = formatDateDDMMYYYY;

/**
 * Parses DD-MM-YYYY or YYYY-MM-DD or ISO string into a valid Date object.
 */
export function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date();

  const str = dateStr.trim();
  // DD-MM-YYYY or MM-DD-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    const [p1, p2, yyyy] = str.split('-').map(Number);
    // If p1 > 12, p1 is day, p2 is month
    if (p1 > 12) {
      return new Date(yyyy, p2 - 1, p1);
    }
    // If p2 > 12, p2 is day, p1 is month
    if (p2 > 12) {
      return new Date(yyyy, p1 - 1, p2);
    }
    // Default assumption for DD-MM-YYYY
    return new Date(yyyy, p2 - 1, p1);
  }
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [yyyy, mm, dd] = str.split('-').map(Number);
    return new Date(yyyy, mm - 1, dd);
  }

  return new Date(str);
}
