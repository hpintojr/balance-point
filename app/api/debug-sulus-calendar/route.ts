import { NextResponse } from "next/server";

// TEMPORARY: probe the /api/v1/calendars/availability endpoint's real
// parameter shape for Balance Point's Training Session calendar (the
// endpoint exists -- confirmed via a 400 VALIDATION_ERROR rather than a
// 404 -- but this account has no configured "appointment types", so
// appointmentTypeId as a query param may be the wrong shape here).
// Delete this route once the native booking rebuild is verified end-to-end.
const CALENDAR_ID = "n97ds9a33htqyesvb4068661y58e9zf8"; // "Training Session" calendar

export async function GET() {
  const apiKey = process.env.SULUS_API_KEY;
  const locationId = process.env.SULUS_CRM_LOCATION_ID;
  const apiBase = process.env.SULUS_API_BASE || "https://neat-platypus-153.convex.site";

  if (!apiKey || !locationId) {
    return NextResponse.json(
      { error: "Missing env var(s)" },
      { status: 500 }
    );
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "X-Sub-Account-Id": locationId,
  };

  const testDate = new Date();
  testDate.setDate(testDate.getDate() + 5);
  const dateStr = testDate.toISOString().slice(0, 10);
  const startMs = testDate.getTime();
  const endDate = new Date(testDate);
  endDate.setDate(endDate.getDate() + 7);
  const endMs = endDate.getTime();

  const base = `${apiBase}/api/v1/calendars/availability`;
  const candidates = [
    `${base}?calendarId=${CALENDAR_ID}&date=${dateStr}`,
    `${base}?calendarId=${CALENDAR_ID}&startDate=${dateStr}&endDate=${endDate.toISOString().slice(0, 10)}`,
    `${base}?calendarId=${CALENDAR_ID}&startDate=${startMs}&endDate=${endMs}`,
    `${base}?appointmentTypeId=${CALENDAR_ID}&startDate=${startMs}&endDate=${endMs}`,
    `${base}?appointmentTypeId=${CALENDAR_ID}&date=${dateStr}&timezone=America/Los_Angeles`,
    `${base}?appointmentTypeId=${CALENDAR_ID}`,
  ];

  const results = await Promise.all(
    candidates.map(async (url) => {
      try {
        const res = await fetch(url, { headers, cache: "no-store" });
        const rawText = await res.text();
        let parsed: unknown = null;
        try {
          parsed = rawText ? JSON.parse(rawText) : null;
        } catch {
          // ignore
        }
        return { url, status: res.status, rawTextPreview: rawText.slice(0, 500), parsed };
      } catch (e) {
        return { url, fetchError: e instanceof Error ? e.message : String(e) };
      }
    })
  );

  return NextResponse.json({ apiBase, calendarId: CALENDAR_ID, results });
}
