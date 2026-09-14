import Mailjet from "node-mailjet";

export type BikeChoice = "own" | "trainer";

export type BookingNotification = {
  email: string;
  name: string;
  phone: string;
  packageName: string;
  sessionStart: string;
  amountPaid: number;
  remainingBalance: number;
  bikeChoice: BikeChoice;
  motorcycleYear?: string;
  motorcycleMake?: string;
  motorcycleModel?: string;
};

export async function sendMailjetConfirmation(data: BookingNotification) {
  const apiKey = process.env.MJ_APIKEY_PUBLIC;
  const apiSecret = process.env.MJ_APIKEY_PRIVATE;
  const fromEmail = process.env.MAILJET_FROM_EMAIL;
  const fromName = process.env.MAILJET_FROM_NAME || "Balance Point Certified";

  if (!apiKey || !apiSecret || !fromEmail) return { skipped: true };

  const mailjet = Mailjet.apiConnect(apiKey, apiSecret);
  const paid = (data.amountPaid / 100).toFixed(2);
  const remaining = (data.remainingBalance / 100).toFixed(2);

  await mailjet.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: { Email: fromEmail, Name: fromName },
        To: [{ Email: data.email, Name: data.name }],
        Subject: `You're booked — ${data.packageName}`,
        TextPart: `You're booked with Balance Point Certified. Package: ${data.packageName}. First session: ${data.sessionStart}. Paid today: $${paid}. Remaining package balance: $${remaining}. The remaining balance is collected directly by Balance Point Certified; cash is welcome. You'll receive reminder messages before your session.`,
        HTMLPart: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;background:#080b12;color:#f8fafc;padding:32px;border-radius:18px"><h1 style="margin-top:0">You're booked.</h1><p>Your first Balance Point Certified session is reserved.</p><p><strong>Package:</strong> ${data.packageName}<br/><strong>First session:</strong> ${data.sessionStart}<br/><strong>Paid today:</strong> $${paid}<br/><strong>Remaining package balance:</strong> $${remaining}</p><p>The remaining balance is collected directly by Balance Point Certified. Cash is welcome.</p><p>Show up ready to train. We’ll take the progression one clean step at a time.</p><p style="color:#9ca3af;font-size:13px">Motorcycle training involves inherent risk. Completion or certification depends on demonstrated standards and is not guaranteed within a fixed number of sessions.</p></div>`,
      },
    ],
  });

  return { sent: true };
}

export async function triggerSequenzy(data: BookingNotification) {
  const webhookUrl = process.env.SEQUENZY_WEBHOOK_URL;
  if (!webhookUrl) return { skipped: true };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "booking.confirmed",
      email: data.email,
      subscriber: {
        email: data.email,
        firstName: data.name.split(" ")[0],
        fullName: data.name,
        phone: data.phone,
      },
      properties: {
        packageName: data.packageName,
        sessionStart: data.sessionStart,
        depositPaid: data.amountPaid / 100,
        remainingBalance: data.remainingBalance / 100,
        balanceCollection: "owner_direct_cash_welcome",
      },
    }),
  });

  if (!response.ok) throw new Error(`Sequenzy webhook failed: ${response.status}`);
  return { sent: true };
}

export type RiderIntake = {
  name: string;
  email: string;
  phone: string;
  packageId: string;
  packageName: string;
  bikeChoice: BikeChoice;
  motorcycleYear?: string;
  motorcycleMake?: string;
  motorcycleModel?: string;
};

// ---------------------------------------------------------------------------
// Sulus CRM REST API client
//
// Sulus's "Inbound Webhook" workflow-automation trigger (the previous integration
// mechanism) turned out not to bind a contact to the execution context at all —
// confirmed via Execution History showing every downstream action node
// (Update Contact / Add Note / Add Tag / Create Opportunity) never actually running,
// despite the workflow reporting "completed". So we talk to Sulus's own REST API
// directly instead, using an API key created in CRM Settings -> Integrations -> API Keys
// (the underlying platform is "Seedly CRM", white-labeled; its REST API is served from
// the Convex deployment's *.convex.site host, not the crm.sulus.ai app domain itself).
// ---------------------------------------------------------------------------

const SULUS_API_BASE = process.env.SULUS_API_BASE || "https://neat-platypus-153.convex.site";
const SULUS_API_KEY = process.env.SULUS_API_KEY;
const SULUS_LOCATION_ID = process.env.SULUS_CRM_LOCATION_ID || "blZQxRCCKPDWhePrhcDg";
const SULUS_PIPELINE_NAME = process.env.SULUS_PIPELINE_NAME || "Rider Bookings";

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || name || "Rider";
  const lastName = parts.join(" ") || "-";
  return { firstName, lastName };
}

async function sulusFetch(path: string, init: RequestInit = {}) {
  if (!SULUS_API_KEY) throw new Error("SULUS_API_KEY not set");
  const res = await fetch(`${SULUS_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${SULUS_API_KEY}`,
      "Content-Type": "application/json",
      "X-Sub-Account-Id": SULUS_LOCATION_ID,
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON response body; fall through with json === null.
  }
  if (!res.ok) {
    throw new Error(`Sulus API ${init.method || "GET"} ${path} -> ${res.status}: ${text.slice(0, 500)}`);
  }
  return json as any;
}

/** Find an existing contact by exact email match, or null. */
async function findContactByEmail(email: string): Promise<string | null> {
  try {
    const result = await sulusFetch(`/api/v1/contacts?email=${encodeURIComponent(email)}`);
    const contacts = result?.data ?? result ?? [];
    return contacts?.[0]?.id ?? null;
  } catch (err) {
    console.error("Sulus contact lookup failed", err);
    return null;
  }
}

/** Create or update a contact by email, merging in tags + custom fields. */
async function upsertSulusContact(input: {
  name: string;
  email: string;
  phone: string;
  tags: string[];
  customFields: Record<string, string>;
}): Promise<string | null> {
  const { firstName, lastName } = splitName(input.name);
  const existingId = await findContactByEmail(input.email);

  const payload = {
    firstName,
    lastName,
    email: input.email,
    phone: input.phone,
    tags: input.tags,
    customFields: input.customFields,
  };

  if (existingId) {
    const result = await sulusFetch(`/api/v1/contacts/${existingId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return result?.data?.id ?? existingId;
  }

  const result = await sulusFetch("/api/v1/contacts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return result?.data?.id ?? result?.id ?? null;
}

let cachedPipeline: { pipelineId: string; stages: Record<string, string> } | null = null;

/** Look up the Rider Bookings pipeline + its stage ids (by stage name), cached per lambda instance. */
async function getRiderBookingsPipeline() {
  if (cachedPipeline) return cachedPipeline;
  try {
    const result = await sulusFetch("/api/v1/pipelines");
    const pipelines = result?.data ?? result ?? [];
    const pipeline =
      pipelines.find((p: any) => p.name === SULUS_PIPELINE_NAME) ?? pipelines[0] ?? null;
    if (!pipeline) return null;
    const stages: Record<string, string> = {};
    for (const stage of pipeline.stages || []) {
      if (stage?.name && stage?.id) stages[stage.name] = stage.id;
    }
    cachedPipeline = { pipelineId: pipeline.id, stages };
    return cachedPipeline;
  } catch (err) {
    console.error("Sulus pipeline lookup failed", err);
    return null;
  }
}

/** Create an opportunity for a contact in the given pipeline stage (best-effort; never throws). */
async function createSulusOpportunity(input: { contactId: string; name: string; stageName: string }) {
  try {
    const pipeline = await getRiderBookingsPipeline();
    if (!pipeline) return;
    const stageId = pipeline.stages[input.stageName] ?? Object.values(pipeline.stages)[0];
    if (!stageId) return;
    await sulusFetch("/api/v1/opportunities", {
      method: "POST",
      body: JSON.stringify({
        pipelineId: pipeline.pipelineId,
        stageId,
        contactId: input.contactId,
        name: input.name,
        value: 0,
        currency: "USD",
        status: "open",
        source: "balancepointcertified.com",
      }),
    });
  } catch (err) {
    console.error("Sulus opportunity creation failed", err);
  }
}

function bikeAndMotorcycleFields(data: {
  bikeChoice: BikeChoice;
  motorcycleYear?: string;
  motorcycleMake?: string;
  motorcycleModel?: string;
}) {
  const fields: Record<string, string> = {
    bike_choice: data.bikeChoice === "own" ? "Own motorcycle" : "School's trainer bike (R3)",
    waiver_acknowledged: "yes",
  };
  if (data.bikeChoice === "own") {
    fields.motorcycle_year = data.motorcycleYear || "";
    fields.motorcycle_make = data.motorcycleMake || "";
    fields.motorcycle_model = data.motorcycleModel || "";
  }
  return fields;
}

/**
 * Sulus's own "Rider Booking Form" (assigned to the Training Session calendar) does not
 * actually render on the live public booking widget — the widget always falls back to its
 * generic First/Last/Email/Phone/Notes fields, regardless of the form assignment. There is
 * no supported prefill mechanism for the embed either (no query params, no postMessage API).
 *
 * So we collect the bike choice / motorcycle year-make-model / waiver acknowledgment
 * ourselves on balancepointcertified.com, *before* the rider reaches the embedded calendar,
 * and push it straight into Sulus via the REST API as a contact upsert (matched by email).
 * Sulus's booking widget also matches/creates the contact by email, so as long as the rider
 * books with the same email they used here, the appointment that gets created a moment later
 * in the embedded calendar lands on the same contact record — carrying this custom field
 * data along with it even though it never touched the widget itself.
 */
export async function pushRiderIntakeToCRM(data: RiderIntake) {
  if (!SULUS_API_KEY) return { skipped: true };

  const contactId = await upsertSulusContact({
    name: data.name,
    email: data.email,
    phone: data.phone,
    tags: ["Website Rider Intake", data.packageName],
    customFields: {
      training_package: data.packageName,
      ...bikeAndMotorcycleFields(data),
    },
  });

  if (contactId) {
    await createSulusOpportunity({
      contactId,
      name: `${data.name} — ${data.packageName}`,
      stageName: "New Booking",
    });
  }

  return { sent: true };
}

export async function pushToCRM(
  data: BookingNotification & { packageId: string; stripeSessionId?: string; paymentMethod: "card_deposit" | "cash" },
) {
  if (!SULUS_API_KEY) return { skipped: true };

  const remaining = (data.remainingBalance / 100).toFixed(2);
  const contactId = await upsertSulusContact({
    name: data.name,
    email: data.email,
    phone: data.phone,
    tags: ["Website Booking", data.paymentMethod === "card_deposit" ? "Deposit Paid" : "Cash Reserved"],
    customFields: {
      training_package: data.packageName,
      payment_method: data.paymentMethod === "card_deposit" ? "Card deposit" : "Cash (pay in person)",
      balance_due: `$${remaining}`,
      ...bikeAndMotorcycleFields(data),
    },
  });

  if (contactId) {
    await createSulusOpportunity({
      contactId,
      name: `${data.name} — ${data.packageName}`,
      stageName: "Session Confirmed",
    });
  }

  return { sent: true };
}
