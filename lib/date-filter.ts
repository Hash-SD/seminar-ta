import { parse, isValid, addDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';

// Helper to parse various date formats commonly used in Indonesia
// Returns a Date object or null if invalid
export function parseFlexibleDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const cleanStr = dateStr.trim().toLowerCase()
    .replace(/pukul/g, '')
    .replace(/wib/g, '')
    .replace(/wita/g, '')
    .replace(/wit/g, '')
    .trim();

  // List of formats to try
  const formats = [
    'dd/MM/yyyy',      // 20/11/2025
    'yyyy-MM-dd',      // 2025-11-20
    'd MMMM yyyy',     // 17 November 2025
    'dd MMMM yyyy',    // 17 November 2025
    'EEEE, d MMMM yyyy', // Senin, 17 November 2025
    'EEEE, dd MMMM yyyy', // Senin, 17 November 2025
    'd MMM yyyy',      // 17 Nov 2025
    'dd MMM yyyy',     // 17 Nov 2025
    'dd-MM-yyyy',      // 20-11-2025
  ];

  // Try parsing strictly first
  for (const fmt of formats) {
    const d = parse(cleanStr, fmt, new Date(), { locale: id });
    if (isValid(d)) return d;
  }

  // Try English fallback just in case
  const dEng = new Date(cleanStr);
  if (isValid(dEng)) return dEng;

  return null;
}

/**
 * Filters data rows to include only dates within the next 7 days (inclusive of today).
 * If no specific date column is provided/mapped, it searches the whole row for a valid date match.
 */
export function filterDataForUpcomingWeek(data: any[], dateColumnIndex: number = -1): any[] {
  const today = startOfDay(new Date());
  const nextWeek = endOfDay(addDays(today, 7)); // 7 days range

  return data.filter(row => {
    let rowDate: Date | null = null;

    // Case 1: Date column is known (Mapped)
    if (dateColumnIndex !== -1 && row[dateColumnIndex]) {
      rowDate = parseFlexibleDate(String(row[dateColumnIndex]));
    }

    // Case 2: No specific column, search whole row for ANY valid date in range
    if (!rowDate) {
      // This is expensive but robust if mapping is wrong
      const cells = Array.isArray(row) ? row : Object.values(row);
      for (const cell of cells) {
        const d = parseFlexibleDate(String(cell));
        if (d && isWithinInterval(d, { start: today, end: nextWeek })) {
          rowDate = d;
          break;
        }
      }
    }

    if (rowDate) {
      // Check if within range
      return isWithinInterval(rowDate, { start: today, end: nextWeek });
    }

    return false;
  });
}

// Kept for backward compatibility if needed, but updated to use parser
export function filterDataForToday(data: any[]): any[] {
  const today = startOfDay(new Date());
  const endOfToday = endOfDay(new Date());

  return data.filter(row => {
     const cells = Array.isArray(row) ? row : Object.values(row);
     return cells.some(cell => {
         const d = parseFlexibleDate(String(cell));
         return d && isWithinInterval(d, { start: today, end: endOfToday });
     });
  });
}
