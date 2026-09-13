import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { createHoldEvent, confirmHoldEvent, deleteEvent, isSlotAvailable } from "@/lib/google-calendar";
import { getPackage } from "@/lib/packages";
import { pushToCRM, sendMailjetConfirmation, triggerSequenzy } from "@/lib/notifications";

export async function POST(request: Request) {
  let holdEventId: string | undefined;

  try {
    const body = await request.json();
    const pkg = getPackage(body.packageId);
    if (!pkg) return NextResponse.json({ error: "Invalid package." }, { status: 400 });

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const sessionStart = String(body.sessionStart || "");
    const waiverAccepted = body.waiverAccepted === true;
    const bikeChoice = body.bikeChoice === "trainer" ? "trainer" : "own";
    const motorcycleYear = String(body.motorcycleYear || "").trim();
    const motorcycleMake = String(body.motorcycleMake || "").trim();
    const motorcycleModel = String(body.motorcycleModel || "").trim();

    if (!name || !email || !phone || !sessionStart || !waiverAccepted) {
      return NextResponse.json({ error: "Complete all required booking fields." }, { status: 400 });
    }

    if (bikeChoice === "own" && (!motorcycleYear || !motorcycleMake || !motorcycleModel)) {
      return NextResponse.json({ error: "Add your motorcycle's year, make, and model." }, { status: 400 });
    }

    const slot = DateTime.fromISO(sessionStart, { setZone: true });
    if (!slot.isValid || slot < DateTime.now().plus({ hours: 1 })) {
      return NextResponse.json({ error: "Please choose a valid future time." }, { status: 400 });
    }

    if (!(await isSlotAvailable(sessionStart, pkg.durationMinutes))) {
      return NextResponse.json({ error: "That time was just booked. Please choose another slot." }, { status: 409 });
    }

    holdEventId = await createHoldEvent({
      startISO: sessionStart,
      durationMinutes: pkg.durationMinutes,
      packageId: pkg.id,
      customerName: name,
      customerEmail: email,
    });

    // No online payment for the "pay at my session" path — confirm the calendar hold immediately.
    await confirmHoldEvent({
      eventId: holdEventId,
      packageName: pkg.name,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      amountPaid: 0,
      bikeChoice,
      motorcycleYear,
      motorcycleMake,
      motorcycleModel,
    });

    const timezone = process.env.BOOKING_TIMEZONE || "America/Los_Angeles";
    const sessionStartFormatted = slot.setZone(timezone).toFormat("cccc, LLLL d 'at' h:mm a ZZZZ");
    const remainingBalance = pkg.price * 100;

    const notification = {
      email,
      name,
      phone,
      packageName: pkg.name,
      sessionStart: sessionStartFormatted,
      amountPaid: 0,
      remainingBalance,
      bikeChoice: bikeChoice as "own" | "trainer",
      motorcycleYear,
      motorcycleMake,
      motorcycleModel,
    };

    const results = await Promise.allSettled([
      sendMailjetConfirmation(notification),
      triggerSequenzy(notification),
      pushToCRM({
        ...notification,
        packageId: pkg.id,
        paymentMethod: "cash",
      }),
    ]);

    results.forEach((result) => {
      if (result.status === "rejected") console.error("Post-booking integration failed", result.reason);
    });

    return NextResponse.json({ url: "/success?method=cash" });
  } catch (error) {
    console.error(error);
    if (holdEventId) {
      try { await deleteEvent(holdEventId); } catch {}
    }
    return NextResponse.json({ error: "Could not complete booking." }, { status: 500 });
  }
}
