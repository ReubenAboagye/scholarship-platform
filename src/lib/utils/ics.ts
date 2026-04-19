/**
 * ICS calendar generation utility
 * Generates RFC 5545-compliant .ics files for scholarship deadlines.
 * Called client-side only — uses URL.createObjectURL for download.
 */

function icsDate(dateStr: string): string {
  // YYYYMMDD — date-only (no time) for all-day events
  return dateStr.replace(/-/g, "");
}

function icsStamp(): string {
  return new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
}

function icsEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function fold(line: string): string {
  // RFC 5545 §3.1: lines > 75 octets MUST be folded
  const chunks: string[] = [];
  let remaining = line;
  while (remaining.length > 75) {
    chunks.push(remaining.slice(0, 75));
    remaining = " " + remaining.slice(75);
  }
  chunks.push(remaining);
  return chunks.join("\r\n");
}

/**
 * Build a .ics string for a scholarship deadline.
 * Includes two VALARM reminders (7 days + 3 days before).
 */
export function buildScholarshipICS(
  scholarshipName: string,
  deadlineDateStr: string,   // YYYY-MM-DD
  appUrl: string = "https://scholarmatch.app"
): string {
  const uid     = `${Date.now()}-${Math.random().toString(36).slice(2)}@scholarmatch.app`;
  const dateVal = icsDate(deadlineDateStr);
  // Deadline day + 1 = DTEND for all-day event
  const nextDay = new Date(deadlineDateStr);
  nextDay.setDate(nextDay.getDate() + 1);
  const dateEnd = icsDate(nextDay.toISOString().split("T")[0]);

  const safeName = icsEscape(scholarshipName);
  const safeDesc = icsEscape(
    `Application deadline for ${scholarshipName}. Track and apply at ${appUrl}`
  );

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ScholarMatch//ScholarMatch Platform//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsStamp()}`,
    `DTSTART;VALUE=DATE:${dateVal}`,
    `DTEND;VALUE=DATE:${dateEnd}`,
    fold(`SUMMARY:📅 Deadline: ${safeName}`),
    fold(`DESCRIPTION:${safeDesc}`),
    "STATUS:CONFIRMED",
    "TRANSP:TRANSPARENT",
    // 7-day reminder
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:-P7D",
    fold(`DESCRIPTION:1 week left to apply — ${safeName}`),
    "END:VALARM",
    // 3-day reminder
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:-P3D",
    fold(`DESCRIPTION:3 days left to apply — ${safeName}`),
    "END:VALARM",
    // 1-day reminder
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:-P1D",
    fold(`DESCRIPTION:Tomorrow is the deadline — ${safeName}`),
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

/**
 * Trigger a browser download of a .ics file for a scholarship deadline.
 */
export function downloadScholarshipICS(
  scholarshipName: string,
  deadlineDateStr: string,
  appUrl?: string
): void {
  const ics      = buildScholarshipICS(scholarshipName, deadlineDateStr, appUrl);
  const blob     = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url      = URL.createObjectURL(blob);
  const filename = scholarshipName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) + "-deadline.ics";

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
