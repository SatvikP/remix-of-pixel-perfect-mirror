import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OutreachEmailRequest {
  to: string;
  subject: string;
  body: string;
  senderName: string;
  replyTo: string;
  startupName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, body, senderName, replyTo, startupName }: OutreachEmailRequest = await req.json();

    // Validate required fields
    if (!to || !subject || !body) {
      console.error("Missing required fields:", { to: !!to, subject: !!subject, body: !!body });
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, and body are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.error("Invalid email format:", to);
      return new Response(
        JSON.stringify({ error: "Invalid recipient email format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Sending outreach email to ${to} for startup: ${startupName}`);

    // Convert plain text body to HTML with proper line breaks
    const htmlBody = body
      .split('\n')
      .map(line => line.trim() === '' ? '<br>' : `<p>${line}</p>`)
      .join('');

    const emailResponse = await resend.emails.send({
      from: `${senderName || 'Investor'} <onboarding@resend.dev>`,
      to: [to],
      reply_to: replyTo || undefined,
      subject: subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${htmlBody}
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-outreach-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
