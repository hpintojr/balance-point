import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });
  const durationParam = Number(searchParams.get("durationMinutes"));
  const durationMinutes = Number.isFinite(durationParam) && durationParam > 0 ? durationParam : undefined;

  try {
    const slots = await getAvailableSlots(date, durationMinutes);
    return NextResponse.json({ slots });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Availability is temporarily unavailable." }, { status: 500 });
  }
}
