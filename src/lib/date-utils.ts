/**
 * Parses DD-MM-YYYY, YYYY-MM-DD, "MMM D, YYYY" (e.g. Nov 13, 2026) or ISO string into a valid Date object.
 */
export function parseDate(dateStr?: string | Date | null): Date {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;

  const str = String(dateStr).trim();

  // DD-MM-YYYY or MM-DD-YYYY with hyphens
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

  // Parse standard date string (e.g. "Nov 13, 2026" or ISO)
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d;
  }

  return new Date();
}

/**
 * Formats any date into clean editorial format: "Nov 13, 2026"
 */
export function formatDate(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';
  const d = parseDate(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Aliases so all existing imports throughout the app automatically output "Nov 13, 2026" style
export const formatDateDDMMYYYY = formatDate;
export const formatDateMMDDYYYY = formatDate;
