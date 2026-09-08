import { google } from "googleapis";
import { DateTime } from "luxon";

const calendarId = process.env.GOOGLE_CALENDAR_ID;
const timezone = process.env.BOOKING_TIMEZONE || "America/Los_Angeles";

function getAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Google Calendar credentials are not configured.");
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

function getCalendar() {
  if (!calendarId) throw new Error("GOOGLE_CALENDAR_ID is not configured.");
  return google.calendar({ version: "v3", auth: getAuth() });
}

export async function isSlotAvailable(startISO: string, durationMinutes = 60) {
  const calendar = getCalendar();
  const start = DateTime.fromISO(startISO, { setZone: true });
  const end = start.plus({ minutes: durationMinutes });

  const result = await calendar.freebusy.query({
    requestBody: {
      timeMin: start.toUTC().toISO() || undefined,
      timeMax: end.toUTC().toISO() || undefined,
      timeZone: timezone,
      items: [{ id: calendarId! }],
    },
  });

  const busy = result.data.calendars?.[calendarId!]?.busy || [];
  return busy.length === 0;
}

export async function getAvailableSlots(date: string) {
  const startHour = Number(process.env.BOOKING_START_HOUR || 9);
  const endHour = Number(process.env.BOOKING_END_HOUR || 17);
  const slotMinutes = Number(process.env.BOOKING_SLOT_MINUTES || 60);
  const selectedDate = DateTime.fromISO(date, { zone: timezone });

  if (!selectedDate.isValid) return [];
  if (selectedDate.startOf("day") < DateTime.now().setZone(timezone).startOf("day")) return [];

  const dayStart = selectedDate.set({ hour: startHour, minute: 0, second: 0, millisecond: 0 });
  const dayEnd = selectedDate.set({ hour: endHour, minute: 0, second: 0, millisecond: 0 });

  const calendar = getCalendar();
  const result = await calendar.freebusy.query({
    requestBody: {
      timeMin: dayStart.toUTC().toISO() || undefined,
      timeMax: dayEnd.toUTC().toISO() || undefined,
      timeZone: timezone,
      items: [{ id: calendarId! }],
    },
  });

  const busy = result.data.calendars?.[calendarId!]?.busy || [];
  const now = DateTime.now().setZone(timezone).plus({ hours: 2 });
  const slots: Array<{ start: string; label: string }> = [];

  for (let cursor = dayStart; cursor.plus({ minutes: slotMinutes }) <= dayEnd; cursor = cursor.plus({ minutes: slotMinutes })) {
    const slotEnd = cursor.plus({ minutes: slotMinutes });
    if (cursor < now) continue;

    const overlaps = busy.some((block) => {
      const busyStart = DateTime.fromISO(block.start || "", { setZone: true });
      const busyEnd = DateTime.fromISO(block.end || "", { setZone: true });
      return cursor < busyEnd && slotEnd > busyStart;
    });

    if (!overlaps) {
      slots.push({
        start: cursor.toISO() || "",
        label: cursor.toFormat("h:mm a"),
      });
    }
  }

  return slots;
}

export async function createHoldEvent(args: {
  startISO: string;
  durationMinutes?: number;
  packageId: string;
  customerName: string;
  customerEmail: string;
}) {
  const calendar = getCalendar();
  const start = DateTime.fromISO(args.startISO, { setZone: true });
  const end = start.plus({ minutes: args.durationMinutes || 60 });

  const event = await calendar.events.insert({
    calendarId: calendarId!,
    requestBody: {
      summary: `HOLD — ${args.customerName}`,
      description: `Temporary checkout hold for ${args.packageId}. Customer: ${args.customerEmail}`,
      start: { dateTime: start.toISO() || undefined, timeZone: timezone },
      end: { dateTime: end.toISO() || undefined, timeZone: timezone },
      transparency: "opaque",
      extendedProperties: {
        private: {
          bpcHold: "true",
          createdAt: new Date().toISOString(),
          packageId: args.packageId,
        },
      },
    },
  });

  if (!event.data.id) throw new Error("Could not create calendar hold.");
  return event.data.id;
}

export async function confirmHoldEvent(args: {
  eventId: string;
  packageName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amountPaid: number;
}) {
  const calendar = getCalendar();
  const existing = await calendar.events.get({ calendarId: calendarId!, eventId: args.eventId });
  const privateProps = existing.data.extendedProperties?.private || {};

  await calendar.events.patch({
    calendarId: calendarId!,
    eventId: args.eventId,
    requestBody: {
      summary: `${args.packageName} — ${args.customerName}`,
      description: [
        `Balance Point Certified booking`,
        `Package: ${args.packageName}`,
        `Rider: ${args.customerName}`,
        `Email: ${args.customerEmail}`,
        `Phone: ${args.customerPhone}`,
        `Paid today: $${(args.amountPaid / 100).toFixed(2)}`,
      ].join("\n"),
      extendedProperties: {
        private: {
          ...privateProps,
          bpcHold: "false",
          confirmedAt: new Date().toISOString(),
        },
      },
    },
  });
}

export async function deleteEvent(eventId: string) {
  const calendar = getCalendar();
  await calendar.events.delete({ calendarId: calendarId!, eventId });
}

export async function cleanupExpiredHolds() {
  const calendar = getCalendar();
  const now = DateTime.now().setZone(timezone);
  const result = await calendar.events.list({
    calendarId: calendarId!,
    timeMin: now.minus({ days: 1 }).toUTC().toISO() || undefined,
    timeMax: now.plus({ days: 45 }).toUTC().toISO() || undefined,
    singleEvents: true,
    maxResults: 2500,
    privateExtendedProperty: ["bpcHold=true"],
  });

  let deleted = 0;
  for (const event of result.data.items || []) {
    const createdAt = event.extendedProperties?.private?.createdAt;
    if (!event.id || !createdAt) continue;
    const created = DateTime.fromISO(createdAt);
    if (created < DateTime.now().minus({ minutes: 30 })) {
      await calendar.events.delete({ calendarId: calendarId!, eventId: event.id });
      deleted += 1;
    }
  }
  return deleted;
}
