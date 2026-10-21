// Race Nations — Page admin : clôture manuelle d'un marché (verdict + payout parimutuel).
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { bettingApi, BetMarketRow, SettleResult, ApiError, newIdemKey, fmtAmount } from '@/lib/api';

export default function SettleMarketPage() {
  const params = useParams<{ id: string }>();
  const marketId = params?.id ?? '';
  const router = useRouter();

  const [market, setMarket] = useState<BetMarketRow | null>(null);
  const [winner, setWinner] = useState<'side0' | 'side1' | 'push'>('side0');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SettleResult | null>(null);

  const load = useCallback(async () => {
    try {
      setMarket(await bettingApi.getMarket(marketId));
    } catch (e) {
      setError(e instanceof ApiError ? `${e.code} — ${e.message}` : 'Erreur réseau');
    }
  }, [marketId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Aperçu du calcul parimutuel côté UI (la vérité reste le backend ; INV-05).
  const preview = useMemo(() => {
    if (!market) return null;
    const bps = BigInt(market.commissionBps);
    const pool = BigInt(market.totalPool);
    const commission = (pool * bps) / 10000n;
    const net = pool - commission;
    const winningStake = winner === 'side0' ? BigInt(market.side0Stake) : winner === 'side1' ? BigInt(market.side1Stake) : 0n;
    // Le net du pool est intégralement réparti (au prorata) sur le côté gagnant.
    const payout = winningStake > 0n && winner !== 'push' ? net : 0n;
    return {
      commission: Number(commission),
      netPool: Number(net),
      refundMode: winner === 'push',
      payoutApprox: Number(payout),
    };
  }, [market, winner]);

  async function submit() {
    if (!market || busy) return;
    setBusy(true);
    setError(null);
    const body = winner === 'push' ? { push: true } : { winningSide: winner === 'side0' ? 0 : 1 };
    try {
      // Clé stable par (marché, verdict) : un retry du même verdict est idempotent (INV-07).
      const res = await bettingApi.settle(market.id, body, newIdemKey(`settle:${market.id}:${JSON.stringify(body)}`));
      setResult(res);
      router.push('/betting');
    } catch (e) {
      setError(e instanceof ApiError ? `${e.code} — ${e.message}` : 'Erreur réseau');
    } finally {
      setBusy(false);
    }
  }

  async function resolveDispute(outcome: 'REFUND_ALL' | 'UPHELD') {
    setBusy(true);
    setError(null);
    try {
      await bettingApi.resolveDispute(marketId, outcome, newIdemKey(`dispute:${marketId}:${outcome}`));
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? `${e.code} — ${e.message}` : 'Erreur réseau');
    } finally {
      setBusy(false);
    }
  }

  if (!market && !error) return <main className="p-6 text-slate-400">Chargement du marché…</main>;

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Clôturer le marché</h1>
        <Link href="/betting" className="text-sm text-indigo-600 hover:underline">
          ← Retour à la liste
        </Link>
      </div>

      {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">{error}</div>}
      {result && (
        <div className="mb-4 rounded bg-emerald-50 p-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
          Marché réglé : commission {fmtAmount(result.commission)}, payé {fmtAmount(result.paidOut)}{' '}
          {result.idempotent ? '(réponse idempotente — déjà réglé)' : ''}
        </div>
      )}

      {market && (
        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
            <Info label="ID" value={market.id} mono />
            <Info label="Statut" value={market.status} />
            <Info label="Devise" value={market.currency} />
            <Info label="Pool total" value={fmtAmount(market.totalPool)} />
            <Info label="Côté 0 (créateur)" value={`${fmtAmount(market.side0Stake)} · ${market.creatorId.slice(0, 8)}…`} />
            <Info
              label="Côté 1 (adversaire)"
              value={`${fmtAmount(market.side1Stake)} · ${market.opponentId ? market.opponentId.slice(0, 8) + '…' : '—'}`}
            />
            <Info label="Commission" value={`${(market.commissionBps / 100).toFixed(2)} %`} />
            <Info label="Clôture" value={new Date(market.closesAt).toLocaleString('fr-FR')} />
          </div>

          {market.status === 'DISPUTED' && (
            <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
              <button
                disabled={busy}
                onClick={() => void resolveDispute('REFUND_ALL')}
                className="rounded bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-400 disabled:opacity-50"
              >
                Rembourser tous les paris
              </button>
              <button
                disabled={busy}
                onClick={() => void resolveDispute('UPHELD')}
                className="rounded bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-50"
              >
                Confirmer le verdict serveur
              </button>
            </div>
          )}
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Verdict</h2>
        <div className="mb-4 space-y-2">
          <Radio name="winner" checked={winner === 'side0'} onChange={() => setWinner('side0')} label="Gagnant : Côté 0 (créateur)" />
          <Radio name="winner" checked={winner === 'side1'} onChange={() => setWinner('side1')} label="Gagnant : Côté 1 (adversaire)" />
          <Radio name="winner" checked={winner === 'push'} onChange={() => setWinner('push')} label="Push : remboursement intégral (annulation)" />
        </div>

        {preview && (
          <div className="mb-4 rounded bg-slate-50 p-3 text-sm text-slate-700">
            {preview.refundMode ? (
              <>Aucune commission prélevée sur un push — pool {fmtAmount(market?.totalPool ?? 0)} remboursé intégralement.</>
            ) : (
              <>
                Commission estimée : <b>{fmtAmount(preview.commission)}</b> · Pool net à répartir :{' '}
                <b>{fmtAmount(preview.netPool)}</b> (règle définitive calculée côté serveur).
              </>
            )}
          </div>
        )}

        <button
          onClick={() => void submit()}
          disabled={busy || !market || market.status === 'SETTLED' || market.status === 'CANCELLED'}
          className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Envoi en cours…' : 'Confirmer le règlement'}
        </button>
        <p className="mt-2 text-xs text-slate-400">
          L&apos;appel POST /v1/betting/markets/:id/settle porte une X-Idempotency-Key dérivée du verdict : rejouer la
          même décision ne double jamais les paiements (test e2e betting-settlement).
        </p>
      </section>
    </main>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className={mono ? 'break-all font-mono text-xs text-slate-600' : 'font-medium text-slate-900'}>{value}</div>
    </div>
  );
}

function Radio({ name, checked, onChange, label }: { name: string; checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="h-4 w-4 accent-indigo-600" />
      {label}
    </label>
  );
}
