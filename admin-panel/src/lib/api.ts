// Race Nations — Client HTTP du back-office (NestJS, base /api → v1). Next.js App Router.
// Usage: import { apiGet, apiPost } from '@/lib/api'
// Auth: cookie httpOnly 'rn_admin_token' posé par /login ; le serveur proxy ajoute Bearer.

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Json = Record<string, unknown> | unknown[] | null;

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  opts: { idempotencyKey?: string; next?: { revalidate: number } } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.idempotencyKey) headers['X-Idempotency-Key'] = opts.idempotencyKey;

  // En Server Component on lit le cookie côté serveur ; NEXT_PUBLIC_* reste safe client.
  const token = typeof document === 'undefined' ? readCookieFromEnv() : null;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    ...(opts.next ? { next: opts.next } : {}),
  });

  let json: Json = null;
  try {
    json = await res.json();
  } catch {
    /* réponse vide */
  }

  if (!res.ok) {
    const j = (json ?? {}) as { code?: string; message?: string; error?: string };
    throw new ApiError(res.status, j.code ?? 'UNKNOWN', j.message ?? j.error ?? `HTTP ${res.status}`);
  }
  return json as T;
}

function readCookieFromEnv(): string | null {
  // Next.js server : RN_ADMIN_TOKEN injecté via middleware/proxy depuis le cookie httpOnly.
  if (typeof process === 'undefined') return null;
  return process.env.RN_ADMIN_TOKEN ?? null;
}

export const apiGet = <T,>(path: string, revalidateSecs = 0) =>
  request<T>('GET', path, undefined, revalidateSecs ? { next: { revalidate: revalidateSecs } } : {});

export const apiPost = <T,>(path: string, body?: unknown, idempotencyKey?: string) =>
  request<T>('POST', path, body, { idempotencyKey });

export const apiPatch = <T,>(path: string, body?: unknown) => request<T>('PATCH', path, body);

// ---- Domaines utilisés par les pages admin ----
export interface BetMarketRow {
  id: string;
  type: string;
  status: string;
  currency: string;
  trackId: string;
  creatorId: string;
  opponentId: string | null;
  stake: number;
  totalPool: number;
  commissionBps: number;
  side0Stake: number;
  side1Stake: number;
  opensAt: string;
  closesAt: string;
  winningSide: number | null;
  createdAt: string;
}

export interface MarketListResponse {
  items: BetMarketRow[];
  nextCursor?: string | null;
}

export interface SettleResult {
  marketId: string;
  status: string;
  winningSide: number | null;
  totalPool: number;
  commission: number;
  paidOut: number;
  idempotent: boolean;
}

export interface HouseWalletSummary {
  balanceCoins: number;
  balanceGems: number;
  lifetimeCommissionCoins: number;
  lifetimeCommissionGems: number;
  openEscrowCoins: number;
  lastSnapshotAt: string;
}

export interface HouseTxRow {
  id: string;
  type: string; // COMMISSION | ESCROW_IN | ESCROW_OUT | REVERSAL
  currency: string;
  amount: number;
  marketId?: string | null;
  createdAt: string;
}

export const bettingApi = {
  listMarkets: (status?: string, limit = 50) =>
    apiGet<MarketListResponse>(`/v1/betting/markets?limit=${limit}${status ? `&status=${status}` : ''}`),
  getMarket: (id: string) => apiGet<BetMarketRow>(`/v1/betting/markets/${id}`),
  settle: (id: string, body: { winningSide?: number; push?: boolean }, idemKey: string) =>
    apiPost<SettleResult>(`/v1/betting/markets/${id}/settle`, body, idemKey),
  resolveDispute: (id: string, outcome: 'REFUND_ALL' | 'UPHELD', idemKey: string) =>
    apiPost<BetMarketRow>(`/v1/betting/markets/${id}/dispute/resolve`, { outcome }, idemKey),
};

export const houseWalletApi = {
  summary: () => apiGet<HouseWalletSummary>('/v1/admin/house-wallet'),
  transactions: (limit = 50) => apiGet<{ items: HouseTxRow[] }>(`/v1/admin/house-wallet/transactions?limit=${limit}`),
  snapshots: (limit = 20) => apiGet<{ items: Json[] }>(`/v1/admin/house-wallet/snapshots?limit=${limit}`),
  reverse: (originalTxId: string, reason: string, idemKey: string) =>
    apiPost<{ ok: boolean }>('/v1/admin/house-wallet/reverse', { originalTxId, reason }, idemKey),
};

export const newIdemKey = (scope: string) =>
  `${scope}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;

export const fmtAmount = (n: number | bigint | null | undefined) =>
  (n ?? 0).toLocaleString('fr-FR');
