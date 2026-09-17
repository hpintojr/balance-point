import { NextResponse } from "next/server";

// TEMPORARY: verify the new Sulus Calendar REST API (calendars -> availability
// -> create appointment) for Balance Point's Training Session calendar.
// Delete this route once the native booking rebuild is verified end-to-end.
//
// The Sulus REST API is served from the underlying Convex deployment's
// *.convex.site host, NOT the crm.sulus.ai app domain. See lib/notifications.ts
// SULUS_API_BASE.
const CALENDAR_ID = "n97ds9a33htqyesvb4068661y58e9zf8"; // "Training Session" calendar

export async function GET() {
  const apiKey = process.env.SULUS_API_KEY;
  const locationId = process.env.SULUS_CRM_LOCATION_ID;
  const apiBase = process.env.SULUS_API_BASE || "https://neat-platypus-153.convex.site";

  if (!apiKey || !locationId) {
    return NextResponse.json(
      { error: "Missing env var(s)", hasApiKey: Boolean(apiKey), hasLocationId: Boolean(locationId) },
      { status: 500 }
    );
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "X-Sub-Account-Id": locationId,
  };

  // A date a few days out, within the calendar's 2-day min notice / 60-day max advance window.
  const testDate = new Date();
  testDate.setDate(testDate.getDate() + 5);
  const dateStr = testDate.toISOString().slice(0, 10);

  const candidates = [
    `${apiBase}/api/v1/calendars/${CALENDAR_ID}`,
    `${apiBase}/api/v1/calendars/types`,
    `${apiBase}/api/v1/appointment-types`,
    `${apiBase}/api/v1/calendars/${CALENDAR_ID}/types`,
    `${apiBase}/api/v1/calendars/availability?appointmentTypeId=${CALENDAR_ID}&date=${dateStr}`,
    `${apiBase}/api/v1/appointments/availability?appointmentTypeId=${CALENDAR_ID}&date=${dateStr}`,
    `${apiBase}/api/v1/availability?appointmentTypeId=${CALENDAR_ID}&date=${dateStr}`,
    `${apiBase}/api/v1/appointments?calendarId=${CALENDAR_ID}&limit=3`,
  ];

  const results = await Promise.all(
    candidates.map(async (url) => {
      try {
        const res = await fetch(url, { headers, cache: "no-store" });
        const contentType = res.headers.get("content-type") || "";
        const rawText = await res.text();
        let parsed: unknown = null;
        try {
          parsed = rawText ? JSON.parse(rawText) : null;
        } catch {
          // leave parsed null; rawTextPreview below shows the body
        }
        return {
          url,
          status: res.status,
          contentType,
          rawTextPreview: rawText.slice(0, 500),
          parsed,
        };
      } catch (e) {
        return { url, fetchError: e instanceof Error ? e.message : String(e) };
      }
    })
  );

  return NextResponse.json({ apiBase, calendarId: CALENDAR_ID, testDate: dateStr, results });
}
