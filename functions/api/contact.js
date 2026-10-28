
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });

export async function onRequestPost({ request, env }) {
  try {
    const form = await request.formData();

    const name = String(form.get("input_text") || "").trim();
    const email = String(form.get("email") || "").trim();
    const phone = String(form.get("numeric_field") || "").trim();
    const message = String(form.get("message") || "").trim();

    if (!name || !email || !message) {
      return json({ error: "Please complete all required fields." }, 400);
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      name.length > 150 ||
      email.length > 254 ||
      phone.length > 40 ||
      message.length > 5000
    ) {
      return json({ error: "Invalid form information." }, 400);
    }

    if (!env.RESEND_API_KEY) {
      return json({ error: "Email service not configured." }, 503);
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Moonstone Website <contact@notifications.moonstoneconstruction.com>",
        to: ["moonstone@moonstoneconstruction.com"],
        reply_to: email,
        subject: "New Moonstone Construction Website Inquiry",
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          `Phone: ${phone}`,
          "",
          "Message:",
          message
        ].join("\n")
      })
    });

        if (!response.ok) {
      const details = await response.text();

      console.error("Resend API error:", {
        status: response.status,
        details
      });

      return json({ error: "Unable to send your message." }, 502);
    }

    return json({ success: true });

  } catch (error) {
    console.error("Contact form error:", error);
    return json({ error: "Unable to process your request." }, 500);
  }
}
