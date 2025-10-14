import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, to, subject, message, tasks, user } = await req.json();

    if (!type || !to) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let result;

    switch (type) {
      case "email":
        result = await sendEmail(to, subject, tasks, user);
        break;
      case "sms":
        result = await sendSMS(to, message, tasks, user);
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid notification type" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
    }

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in send-notification function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function sendEmail(to: string, subject: string, tasks: any[], user: any) {
  // Используем Resend API для отправки email
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured");
  }

  // const taskList = tasks.map(task =>
  //   `- ${task.title} (Срок: ${new Date(task.due_date).toLocaleDateString('ru-RU')})`
  // ).join('\n')

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${subject}</h2>
      <p>Здравствуйте, ${user.name}!</p>
      <p>У вас ${tasks.length} ${tasks.length === 1 ? "задача" : "задач"}:</p>
      <ul style="list-style: none; padding: 0;">
        ${tasks
          .map(
            (task) =>
              `<li style="padding: 10px; margin: 5px 0; background: #f5f5f5; border-radius: 5px;">
            <strong>${task.title}</strong><br>
            <small>Срок: ${new Date(task.due_date).toLocaleDateString("ru-RU")}</small>
          </li>`,
          )
          .join("")}
      </ul>
      <p>Пожалуйста, проверьте ваши задачи в системе управления инвентарем.</p>
      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        Это автоматическое уведомление. Если у вас есть вопросы, обратитесь к администратору.
      </p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Inventory App <noreply@yourdomain.com>",
      to: [to],
      subject: subject,
      html: htmlContent,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await response.json();
}

async function sendSMS(to: string, message: string, tasks: any[], _user: any) {
  // Используем Twilio API для отправки SMS
  const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
  const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
  const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    throw new Error("Twilio credentials not configured");
  }

  // Форматируем номер телефона
  const formattedPhone = to.startsWith("+") ? to : `+${to}`;

  const fullMessage = `${message}\n\nЗадачи:\n${tasks
    .map(
      (task) =>
        `• ${task.title} (${new Date(task.due_date).toLocaleDateString("ru-RU")})`,
    )
    .join("\n")}\n\nПроверьте в системе управления инвентарем.`;

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: TWILIO_PHONE_NUMBER,
        To: formattedPhone,
        Body: fullMessage,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio API error: ${error}`);
  }

  return await response.json();
}
