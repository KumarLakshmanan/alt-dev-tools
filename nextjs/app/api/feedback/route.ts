import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase";
import nodemailer from "nodemailer";

/**
 * POST /api/feedback
 * Saves uninstall/general feedback to the Supabase `feedbacks` table AND
 * sends an email notification via Gmail SMTP.
 *
 * Required env variables:
 *   SUPABASE_URL              — Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Supabase service role key (server-side only)
 *   SMTP_USER                 — Gmail address (e.g. you@gmail.com)
 *   SMTP_PASS                 — Gmail App Password
 *   FEEDBACK_TO_EMAIL         — Recipient address for notifications
 */
export async function POST(req: NextRequest) {
  let reason = "";
  let source = "unknown";

  try {
    const body = await req.json();
    reason = (body?.reason ?? "").toString().trim();
    source = (body?.source ?? "unknown").toString().trim();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid body." }, { status: 400 });
  }

  if (!reason) {
    return NextResponse.json({ success: false, error: "Reason is required." }, { status: 400 });
  }

  let persisted = false;
  let emailed = false;

  // ── Persist to Supabase ──
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase
        .from("feedbacks")
        .insert({ source, reason });
      if (error) throw error;
      persisted = true;
    } catch (err) {
      console.error("[Feedback] Supabase error:", err);
    }
  }

  // ── Send email notification ──
  if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.FEEDBACK_TO_EMAIL) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: `"Alt DevTools" <${process.env.SMTP_USER}>`,
        to: process.env.FEEDBACK_TO_EMAIL,
        subject: `[Alt DevTools] New feedback — ${source}`,
        text: `Source: ${source}\n\nFeedback:\n${reason}`,
        html: `<p><strong>Source:</strong> ${source}</p><p><strong>Feedback:</strong></p><p>${reason.replace(/\n/g, "<br>")}</p>`,
      });
      emailed = true;
    } catch (err) {
      console.error("[Feedback] SMTP error:", err);
    }
  }

  return NextResponse.json({ success: true, persisted, emailed });
}

