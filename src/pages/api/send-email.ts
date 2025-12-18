import type { APIContext } from "astro";

export const prerender = false;

export async function POST(Astro: APIContext) {
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

  let name = "Unknown";
  let email = "unknown@example.com";

  try {
    const body = await Astro.request.json();
    name = body.name || name;
    email = body.email || email;
  } catch (error) {}

  const endpoint = "https://send.api.mailtrap.io/api/send";
  const data: any = {
    from: { email: "hello@mariannefeng.com", name: "Friendly Stranger" },
    to: [{ email: "feng.marianne@gmail.com" }],
    subject: `New message from ${name}`,
    text: `${name} says hi`,
    category: "Contact Form",
  };

  if (email !== "unknown@example.com") {
    data.cc = [{ email: email }];
  }

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
