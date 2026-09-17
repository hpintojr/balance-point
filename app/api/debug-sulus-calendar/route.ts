import { NextResponse } from "next/server";

// TEMPORARY: verify the new calendars-scoped Sulus API key can read the
// Training Session calendar + appointment types for Balance Point. Delete
// this route once verified (see debug-sulus-calendar cleanup note).
export async function GET() {
  const apiKey = process.env.SULUS_API_KEY;
  const locationId = process.env.SULUS_CRM_LOCATION_ID;

  if (!apiKey || !locationId) {
    return NextResponse.json(
      {
        error: "Missing env var(s)",
        hasApiKey: Boolean(apiKey),
        apiKeyLength: apiKey ? apiKey.length : 0,
        hasLocationId: Boolean(locationId),
        locationIdLength: locationId ? locationId.length : 0,
      },
      { status: 500 }
    );
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "X-Sub-Account-Id": locationId,
  };

  const [calendarsRes, typesRes] = await Promise.all([
    fetch("https://crm.sulus.ai/api/v1/calendars", { headers, cache: "no-store" }),
    fetch("https://crm.sulus.ai/api/v1/calendars/types", { headers, cache: "no-store" }),
  ]);

  const calendars = await calendarsRes.json().catch(() => null);
  const types = await typesRes.json().catch(() => null);

  return NextResponse.json({
    calendarsStatus: calendarsRes.status,
    calendars,
    typesStatus: typesRes.status,
    types,
  });
}
