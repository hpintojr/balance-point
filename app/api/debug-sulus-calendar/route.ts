import { NextResponse } from "next/server";

// TEMPORARY: full native-booking pipeline test.
// action=setup      -> create (or reuse) the "Training Session" appointment type
// action=availability&date=YYYY-MM-DD&typeId=... -> list open slots
// action=book&bike=own|r3&start=...&end=...&typeId=... -> create a real test appointment
// Delete this route once the native booking rebuild is verified end-to-end.
const CALENDAR_ID = "n97ds9a33htqyesvb4068661y58e9zf8"; // "Training Session" calendar

function client() {
  const apiKey = process.env.SULUS_API_KEY;
  const locationId = process.env.SULUS_CRM_LOCATION_ID;
  const apiBase = process.env.SULUS_API_BASE || "https://neat-platypus-153.convex.site";
  if (!apiKey || !locationId) throw new Error("Missing SULUS_API_KEY or SULUS_CRM_LOCATION_ID");
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "X-Sub-Account-Id": locationId,
    "Content-Type": "application/json",
  };
  return { apiBase, headers };
}

async function asJson(res: Response) {
  const text = await res.text();
  try {
    return { status: res.status, body: text ? JSON.parse(text) : null };
  } catch {
    return { status: res.status, body: text.slice(0, 500) };
  }
}

export async function GET(req: Request) {
  const { apiBase, headers } = client();
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "setup";

  try {
    if (action === "setup") {
      const existing = await asJson(
        await fetch(`${apiBase}/api/v1/calendars/types?calendarId=${CALENDAR_ID}`, { headers, cache: "no-store" })
      );
      const list = (existing.body as any)?.data ?? [];
      if (Array.isArray(list) && list.length > 0) {
        return NextResponse.json({ action, note: "already exists", type: list[0] });
      }
      const created = await asJson(
        await fetch(`${apiBase}/api/v1/calendars/types`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            calendarId: CALENDAR_ID,
            name: "Training Session",
            duration: 60,
            description: "Private 60-minute wheelie training session",
          }),
        })
      );
      return NextResponse.json({ action, created });
    }

    if (action === "availability") {
      const date = url.searchParams.get("date");
      const typeId = url.searchParams.get("typeId");
      if (!date || !typeId) return NextResponse.json({ error: "date and typeId required" }, { status: 400 });
      const result = await asJson(
        await fetch(
          `${apiBase}/api/v1/calendars/availability?appointmentTypeId=${typeId}&date=${date}`,
          { headers, cache: "no-store" }
        )
      );
      return NextResponse.json({ action, date, typeId, result });
    }

    if (action === "book-probe") {
      const typeId = url.searchParams.get("typeId");
      const start = url.searchParams.get("start");
      const end = url.searchParams.get("end");
      if (!typeId || !start || !end) {
        return NextResponse.json({ error: "typeId, start, end required" }, { status: 400 });
      }
      const startMs = new Date(start).getTime();
      const endMs = new Date(end).getTime();
      const variants: Record<string, unknown>[] = [
        {
          appointmentTypeId: typeId,
          startTime: start,
          endTime: end,
          firstName: "Test",
          lastName: "Rider",
          email: "testriderprobe@balancepointcertified.com",
        },
        {
          appointmentTypeId: typeId,
          startTime: startMs,
          endTime: endMs,
          firstName: "Test",
          lastName: "Rider",
          email: "testriderprobe2@balancepointcertified.com",
        },
        {
          appointmentTypeId: typeId,
          calendarId: CALENDAR_ID,
          startTime: start,
          endTime: end,
          firstName: "Test",
          lastName: "Rider",
          email: "testriderprobe3@balancepointcertified.com",
        },
        {
          appointmentTypeId: typeId,
          startTime: start,
          endTime: end,
          firstName: "Test",
          lastName: "Rider",
          email: "testriderprobe4@balancepointcertified.com",
          phone: "+15555550123",
        },
      ];
      const results = await Promise.all(
        variants.map(async (payload) => {
          const result = await asJson(
            await fetch(`${apiBase}/api/v1/calendars/appointments`, {
              method: "POST",
              headers,
              body: JSON.stringify(payload),
            })
          );
          return { payload, result };
        })
      );
      return NextResponse.json({ action, results });
    }

    if (action === "book" || action === "book-minimal") {
      const typeId = url.searchParams.get("typeId");
      const start = url.searchParams.get("start");
      const end = url.searchParams.get("end");
      const bike = url.searchParams.get("bike") || "own";
      if (!typeId || !start || !end) {
        return NextResponse.json({ error: "typeId, start, end required" }, { status: 400 });
      }
      const label = bike === "r3" ? "R3 (rental)" : "Own bike";
      const payload: Record<string, unknown> =
        action === "book-minimal"
          ? {
              appointmentTypeId: typeId,
              startTime: start,
              endTime: end,
              firstName: "TEST BOOKING",
              lastName: `DELETE ME (${label})`,
              email: `test+${bike}@balancepointcertified.com`,
            }
          : {
              appointmentTypeId: typeId,
              startTime: start,
              endTime: end,
              firstName: "TEST BOOKING",
              lastName: `DELETE ME (${label})`,
              email: `test+${bike}@balancepointcertified.com`,
              notes: `Native booking pipeline test - bike choice: ${label}`,
              formData: { bikeChoice: label },
              selectedLocation: { type: "in_person" },
            };
      const result = await asJson(
        await fetch(`${apiBase}/api/v1/calendars/appointments`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        })
      );
      return NextResponse.json({ action, bike, payload, result });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
