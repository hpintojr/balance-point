import Stripe from "stripe";
import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import { createHoldEvent, deleteEvent, isSlotAvailable } from "@/lib/google-calendar";
import { getPackage } from "@/lib/packages";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

export async function POST(request: Request) {
  let holdEventId: string | undefined;

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 503 });
    }

    const body = await request.json();
    const pkg = getPackage(body.packageId);
    if (!pkg) return NextResponse.json({ error: "Invalid package." }, { status: 400 });

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const sessionStart = String(body.sessionStart || "");
    const waiverAccepted = body.waiverAccepted === true;

    if (!name || !email || !phone || !sessionStart || !waiverAccepted) {
      return NextResponse.json({ error: "Complete all required booking fields." }, { status: 400 });
    }

    const slot = DateTime.fromISO(sessionStart, { setZone: true });
    if (!slot.isValid || slot < DateTime.now().plus({ hours: 1 })) {
      return NextResponse.json({ error: "Please choose a valid future time." }, { status: 400 });
    }

    if (!(await isSlotAvailable(sessionStart))) {
      return NextResponse.json({ error: "That time was just booked. Please choose another slot." }, { status: 409 });
    }

    holdEventId = await createHoldEvent({
      startISO: sessionStart,
      packageId: pkg.id,
      customerName: name,
      customerEmail: email,
    });

    const amount = pkg.deposit;
    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      phone_number_collection: { enabled: false },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount * 100,
            product_data: {
              name: `${pkg.name} — Reservation Deposit`,
              description: `$${pkg.deposit} deposit toward $${pkg.price} package. Remaining balance is collected directly by Balance Point Certified.`,
            },
          },
        },
      ],
      metadata: {
        packageId: pkg.id,
        packageName: pkg.name,
        sessionStart,
        holdEventId,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        paymentMode: "deposit",
        totalPackagePrice: String(pkg.price * 100),
      },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?booking=cancelled#book`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(error);
    if (holdEventId) {
      try { await deleteEvent(holdEventId); } catch {}
    }
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}
