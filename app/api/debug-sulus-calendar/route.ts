import { NextResponse } from "next/server";

// TEMPORARY diagnostic route — calls Sulus's calendar endpoints server-side to
// discover real calendarId / appointmentTypeId values. Delete once discovery is done.
const SULUS_API_BASE = process.env.SULUS_API_BASE || "https://neat-platypus-153.convex.site";
const SULUS_API_KEY = process.env.SULUS_API_KEY;
const SULUS_LOCATION_ID = process.env.SULUS_CRM_LOCATION_ID || "blZQxRCCKPDWhePrhcDg";

export async function GET() {
  try {
    const typesRes = await fetch(`${SULUS_API_BASE}/api/v1/calendars/types`, {
      headers: {
        ...(SULUS_API_KEY ? { Authorization: `Bearer ${SULUS_API_KEY}` } : {}),
        "X-Sub-Account-Id": SULUS_LOCATION_ID,
      },
    });
    const typesText = await typesRes.text();
    let types: unknown = null;
    try { types = JSON.parse(typesText); } catch {}

    return NextResponse.json({
      typesStatus: typesRes.status,
      types: types ?? typesText.slice(0, 2000),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
