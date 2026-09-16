import { StudyTopic } from '../types';

export interface ExamDateTimeSetting {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  timestamp: number;
}

const STORAGE_KEY = 'exam_rescue_target_datetime';

/**
 * Parses YYYY-MM-DD and HH:mm in local time without UTC offset distortion
 */
export function parseExamDateTime(dateStr: string, timeStr: string): number {
  if (!dateStr || !timeStr) return 0;
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const [hourStr, minStr] = timeStr.split(':');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10);
  const min = parseInt(minStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(min)) {
    return 0;
  }

  const d = new Date(year, month, day, hour, min, 0, 0);
  return d.getTime();
}

/**
 * Returns a human-readable date string, e.g. "Sep 16, 2026"
 */
export function formatExamDate(dateStr: string, timestamp?: number): string {
  const ts = timestamp || (dateStr ? parseExamDateTime(dateStr, '12:00') : 0);
  if (!ts) return dateStr || 'Selected Date';
  try {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Returns a human-readable time string, e.g. "09:30 AM"
 */
export function formatExamTime(timeStr: string, timestamp?: number): string {
  const ts = timestamp || (timeStr ? parseExamDateTime('2026-01-01', timeStr) : 0);
  if (!ts) return timeStr || 'Selected Time';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return timeStr;
  }
}

/**
 * Gets default initial exam date & time (either from storage or tomorrow at 09:00 AM)
 */
export function getDefaultExamDateTime(): ExamDateTimeSetting {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: ExamDateTimeSetting = JSON.parse(saved);
        if (parsed.timestamp && parsed.timestamp > Date.now()) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
  }

  // Default: tomorrow at 09:00 AM local time
  const target = new Date();
  target.setDate(target.getDate() + 1);
  target.setHours(9, 0, 0, 0);

  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  const timeStr = '09:00';

  return {
    date: dateStr,
    time: timeStr,
    timestamp: target.getTime()
  };
}

/**
 * Save user's selected exam date and time to localStorage
 */
export function saveExamDateTime(setting: ExamDateTimeSetting): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(setting));
  }
}

/**
 * Calculate exact time remaining components
 */
export function calculateRemainingTime(targetTimestamp: number, currentTimestamp: number = Date.now()) {
  const diffMs = targetTimestamp - currentTimestamp;
  
  if (diffMs <= 0) {
    return {
      totalSeconds: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      hoursDecimal: 0,
      isPassed: true
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const hoursDecimal = Number((totalSeconds / 3600).toFixed(1));

  return {
    totalSeconds,
    hours,
    minutes,
    seconds,
    hoursDecimal,
    isPassed: false
  };
}

/**
 * Adjust topic study minutes according to user's remaining time budget
 * Remaining time directly dictates study sprint capacity!
 */
export function scaleTopicsForRemainingTime(
  topics: StudyTopic[],
  hoursRemaining: number
): StudyTopic[] {
  if (!topics || topics.length === 0) return [];
  const totalAvailableStudyMinutes = Math.max(20, Math.floor(hoursRemaining * 60 * 0.70)); // Reserve 30% for quick recall & test arrival

  const rawTotalMinutes = topics.reduce((acc, t) => acc + (t.recommendedMinutes || 20), 0);
  if (rawTotalMinutes === 0) return topics;

  // Scale proportionally with high-priority floor
  const ratio = Math.min(1.8, Math.max(0.35, totalAvailableStudyMinutes / rawTotalMinutes));

  return topics.map((t) => {
    let scaled = Math.round(t.recommendedMinutes * ratio);
    // Enforce priority-based minimums & maximums based on time crunch
    if (t.priority === 'high') {
      scaled = Math.max(15, scaled);
    } else if (t.priority === 'medium') {
      scaled = Math.max(8, scaled);
    } else {
      scaled = Math.max(5, scaled);
    }

    return {
      ...t,
      recommendedMinutes: scaled
    };
  });
}
