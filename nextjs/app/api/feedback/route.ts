import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { reason, source } = await req.json();
    // Log feedback — in production you'd save this to Supabase
    console.log(`[Feedback] source=${source} reason="${reason}"`);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
