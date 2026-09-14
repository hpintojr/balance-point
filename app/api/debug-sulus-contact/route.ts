import { NextResponse } from "next/server";

// TEMPORARY diagnostic route used to verify the Sulus REST API integration end-to-end
// after switching off the broken Inbound-Webhook mechanism. Safe to delete once confirmed.
export async function GET(request: Request) {
  const apiKey = process.env.SULUS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "SULUS_API_KEY not set" }, { status: 500 });

  const url = new URL(request.url);
  const email = url.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "?email= required" }, { status: 400 });

  const base = process.env.SULUS_API_BASE || "https://neat-platypus-153.convex.site";
  const locationId = process.env.SULUS_CRM_LOCATION_ID || "blZQxRCCKPDWhePrhcDg";

  const res = await fetch(`${base}/api/v1/contacts?email=${encodeURIComponent(email)}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-Sub-Account-Id": locationId,
    },
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
}
