// lib/api.ts – thin wrapper around fetch for AfriPay API calls

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

/**
 * Join the waitlist (landing page CTA).
 */
export async function joinWaitlist(data: {
  name: string;
  email: string;
  country: string;
}): Promise<{ message: string }> {
  const res = await fetch(`${BASE_URL}/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error ?? "Request failed");
  }

  return res.json();
}

/**
 * Fetch public stats shown on the landing page.
 * Uses Next.js fetch caching – revalidates every 60 s.
 */
export async function getPublicStats() {
  const res = await fetch(`${BASE_URL}/stats`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) return null;
  return res.json();
}
