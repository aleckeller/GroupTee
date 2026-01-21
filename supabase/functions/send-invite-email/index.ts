import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  email: string;
  inviteCode: string;
  groupName: string;
  inviterName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email, inviteCode, groupName, inviterName }: InviteEmailRequest =
      await req.json();

    // Validate required fields
    if (!email || !inviteCode || !groupName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GroupTee Invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">GroupTee</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Golf Tee Time Management</p>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <h2 style="color: #1e293b; margin-top: 0;">You're Invited!</h2>

    <p>${inviterName ? `<strong>${inviterName}</strong> has invited you` : "You've been invited"} to join <strong>${groupName}</strong> on GroupTee.</p>

    <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">Your Invite Code</p>
      <p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #0ea5e9;">${inviteCode}</p>
    </div>

    <h3 style="color: #334155;">How to Join</h3>
    <ol style="color: #475569; padding-left: 20px;">
      <li style="margin-bottom: 8px;">Download the GroupTee app</li>
      <li style="margin-bottom: 8px;">Create an account or sign in</li>
      <li style="margin-bottom: 8px;">Enter your invite code when prompted</li>
    </ol>

    <div style="margin: 24px 0;">
      <p style="color: #64748b; font-size: 14px; margin-bottom: 12px;">Get the app:</p>
      <a href="#" style="display: inline-block; background: #1e293b; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin-right: 8px; font-weight: 500;">App Store</a>
      <a href="#" style="display: inline-block; background: #1e293b; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500;">Google Play</a>
    </div>
  </div>

  <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">
    GroupTee - Simplifying golf tee time management for groups
  </p>
</body>
</html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "GroupTee <onboarding@resend.dev>",
        to: [email],
        subject: `You've been invited to join ${groupName} on GroupTee`,
        html: htmlContent,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      return new Response(
        JSON.stringify({ error: data.message || "Failed to send email" }),
        {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, messageId: data.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending invite email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
