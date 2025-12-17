export const prerender = false;

export async function POST() {
  const mailtrapApiKey = import.meta.env.MAILTRAP_API_KEY;

  if (!mailtrapApiKey) {
    return new Response(
      JSON.stringify({ error: "MAILTRAP_API_KEY is not configured" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const endpoint = "https://send.api.mailtrap.io/api/send";
  const data = {
    from: { email: "hello@demomailtrap.co", name: "Mailtrap Test" },
    to: [{ email: "feng.marianne@gmail.com" }],
    subject: "You are awesome!",
    text: "Congrats for sending test email with Mailtrap!",
    category: "Integration Test",
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mailtrapApiKey}`,
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const result = await response.json();
      return new Response(JSON.stringify({ success: true, result }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: "Mailtrap API error", details: errorText }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Request failed",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
