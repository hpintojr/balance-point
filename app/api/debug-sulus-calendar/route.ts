import { NextResponse } from "next/server";

// TEMPORARY diagnostic route — calls Sulus's public (no-auth) calendar endpoints
// server-side to discover real calendarId / appointmentTypeId values, sidestepping
// the browser CORS block on the *.convex.site host. Delete once discovery is done.
const SULUS_API_BASE = process.env.SULUS_API_BASE || "https://neat-platypus-153.convex.site";

export async function GET() {
  try {
    const typesRes = await fetch(`${SULUS_API_BASE}/api/v1/calendars/types`);
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
