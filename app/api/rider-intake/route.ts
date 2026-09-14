import { NextResponse } from "next/server";
import { getPackage } from "@/lib/packages";
import { pushRiderIntakeToCRM } from "@/lib/notifications";

// Collects the rider info Sulus's own booking widget can't (bike choice, motorcycle
// year/make/model, waiver acknowledgment) and pushes it to the CRM as a contact upsert
// *before* the rider picks a time in the embedded Sulus calendar. See the comment on
// pushRiderIntakeToCRM in lib/notifications.ts for why this two-step flow exists.
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const pkg = getPackage(String(body.packageId || ""));
    if (!pkg) return NextResponse.json({ error: "Invalid package." }, { status: 400 });

    const email = String(body.email || "").trim();
    const waiverAccepted = body.waiverAccepted === true;
    const bikeChoice = body.bikeChoice === "trainer" ? "trainer" : "own";
    const motorcycleYear = String(body.motorcycleYear || "").trim();
    const motorcycleMake = String(body.motorcycleMake || "").trim();
    const motorcycleModel = String(body.motorcycleModel || "").trim();

    if (!email || !waiverAccepted) {
      return NextResponse.json({ error: "Add your email and accept the waiver." }, { status: 400 });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    if (bikeChoice === "own" && (!motorcycleYear || !motorcycleMake || !motorcycleModel)) {
      return NextResponse.json({ error: "Add your motorcycle's year, make, and model." }, { status: 400 });
    }

    await pushRiderIntakeToCRM({
      email,
      packageId: pkg.id,
      packageName: pkg.name,
      bikeChoice,
      motorcycleYear,
      motorcycleMake,
      motorcycleModel,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Rider intake failed", error);
    return NextResponse.json({ error: "Could not save your details. Please try again." }, { status: 500 });
  }
}
