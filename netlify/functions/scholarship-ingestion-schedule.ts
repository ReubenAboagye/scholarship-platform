export default async function handler() {
  const siteUrl = process.env.URL;
  const triggerSecret = process.env.SCHOLARSHIP_INGESTION_SECRET;

  if (!siteUrl || !triggerSecret) {
    console.error("Scholarship ingestion scheduler is missing URL or SCHOLARSHIP_INGESTION_SECRET");
    return new Response(null, { status: 500 });
  }

  const response = await fetch(new URL("/.netlify/functions/scholarship-ingestion", siteUrl), {
    method: "POST",
    headers: { "x-scholarship-ingestion-secret": triggerSecret },
  });

  if (response.status !== 202) {
    const body = await response.text();
    console.error("Could not start scholarship ingestion", { status: response.status, body });
    return new Response(null, { status: 502 });
  }

  return new Response(null, { status: 204 });
}

export const config = {
  schedule: "0 2 * * *",
};
