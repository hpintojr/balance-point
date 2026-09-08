import { NextResponse } from "next/server";
import { cleanupExpiredHolds } from "@/lib/google-calendar";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const deleted = await cleanupExpiredHolds();
    return NextResponse.json({ deleted });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
