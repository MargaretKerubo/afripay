// ── API response types matching the Go backend models ──────────────────────

export interface PublicStats {
  waitlist_count: number;
  countries_served: number;
  avg_fee_pct: number;
  traditional_fee_pct: number;
}

export interface WaitlistResponse {
  message: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  country: string;
  created_at: string;
}

export interface Payment {
  id: number;
  user_id: number;
  sender_country: string;
  recipient_country: string;
  amount_usd: number;
  amount_btc: number;
  btc_price_usd: number;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  updated_at: string;
}

// ── UI helper types ─────────────────────────────────────────────────────────

export interface Feature {
  icon: string;
  title: string;
  description: string;
  accent: "gold" | "savanna";
}

export interface ProblemStat {
  value: string;
  label: string;
  source: string;
}

export interface StepItem {
  step: number;
  title: string;
  description: string;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
}
