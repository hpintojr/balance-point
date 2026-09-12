import Mailjet from "node-mailjet";
import { createHmac } from "crypto";

export type BookingNotification = {
  email: string;
  name: string;
  phone: string;
  packageName: string;
  sessionStart: string;
  amountPaid: number;
  remainingBalance: number;
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

export async function pushToCRM(data: BookingNotification & { packageId: string; stripeSessionId: string }) {
  // Sulus CRM "Inbound Webhook" workflow trigger. The workflow expects the raw JSON body to be
  // signed with HMAC-SHA256 using the workflow's signing secret:  X-Webhook-Signature: sha256=<hex>
  const webhookUrl = process.env.SULUS_CRM_WEBHOOK_URL;
  if (!webhookUrl) return { skipped: true };

  const locationId = process.env.SULUS_CRM_LOCATION_ID || "blZQxRCCKPDWhePrhcDg";
  const secret = process.env.SULUS_CRM_WEBHOOK_TOKEN;
  const body = JSON.stringify({
    source: "balancepointcertified.com",
    event: "booking.deposit_paid",
    locationId,
    contact: {
      firstName: data.name.split(" ")[0],
      lastName: data.name.split(" ").slice(1).join(" "),
      name: data.name,
      email: data.email,
      phone: data.phone,
    },
    booking: {
      packageId: data.packageId,
      packageName: data.packageName,
      sessionStart: data.sessionStart,
      depositPaid: data.amountPaid / 100,
      remainingBalance: data.remainingBalance / 100,
      paymentMethod: "card_deposit",
      balanceCollection: "owner_direct_cash_welcome",
      stripeSessionId: data.stripeSessionId,
    },
  });

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) {
    headers["X-Webhook-Signature"] = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  }

  const response = await fetch(webhookUrl, { method: "POST", headers, body });
  if (!response.ok) throw new Error(`CRM webhook failed: ${response.status}`);
  return { sent: true };
}
