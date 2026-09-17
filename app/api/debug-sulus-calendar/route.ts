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

  const endpoints = [
    "https://crm.sulus.ai/api/v1/calendars",
    "https://crm.sulus.ai/api/v1/calendars/types",
  ];

  const results = await Promise.all(
    endpoints.map(async (url) => {
      try {
        const res = await fetch(url, { headers, cache: "no-store" });
        const contentType = res.headers.get("content-type") || "";
        const rawText = await res.text();
        let parsed: unknown = null;
        let parseError: string | null = null;
        try {
          parsed = rawText ? JSON.parse(rawText) : null;
        } catch (e) {
          parseError = e instanceof Error ? e.message : String(e);
        }
        return {
          url,
          status: res.status,
          contentType,
          rawTextLength: rawText.length,
          rawTextPreview: rawText.slice(0, 800),
          parsed,
          parseError,
        };
      } catch (e) {
        return {
          url,
          fetchError: e instanceof Error ? e.message : String(e),
        };
      }
    })
  );

  return NextResponse.json({ results });
}
