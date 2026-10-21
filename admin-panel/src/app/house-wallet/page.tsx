// Race Nations — Dashboard admin : portefeuille de la maison (commissions, escrow, journal).
'use client';

import { useCallback, useEffect, useState } from 'react';
import { houseWalletApi, HouseWalletSummary, HouseTxRow, ApiError, fmtAmount, newIdemKey } from '@/lib/api';

const TYPE_STYLE: Record<string, string> = {
  COMMISSION: 'bg-emerald-100 text-emerald-800',
  ESCROW_IN: 'bg-sky-100 text-sky-800',
  ESCROW_OUT: 'bg-indigo-100 text-indigo-800',
  REVERSAL: 'bg-rose-100 text-rose-700',
};

export default function HouseWalletPage() {
  const [summary, setSummary] = useState<HouseWalletSummary | null>(null);
  const [txs, setTxs] = useState<HouseTxRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reverseTarget, setReverseTarget] = useState<string>('');
  const [reverseReason, setReverseReason] = useState<string>('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const [s, t] = await Promise.all([houseWalletApi.summary(), houseWalletApi.transactions(50)]);
      setSummary(s);
      setTxs(t.items ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? `${e.code} — ${e.message}` : 'Erreur réseau');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function reverse() {
    if (!reverseTarget || !reverseReason || busy) return;
    setBusy(true);
    try {
      // Clé dérivée de la transaction ciblée : un double-clic ne crée pas deux avoirs (INV-09).
      await houseWalletApi.reverse(reverseTarget, reverseReason, newIdemKey(`reverse:${reverseTarget}`));
      setReverseTarget('');
      setReverseReason('');
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? `${e.code} — ${e.message}` : 'Erreur réseau');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Portefeuille de la maison</h1>
        <button
          onClick={() => void load()}
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Rafraîchir
        </button>
      </div>

      {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">{error}</div>}

      {/* Cartes de synthèse */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Solde Coins" value={summary ? fmtAmount(summary.balanceCoins) : '—'} tone="text-slate-900" />
        <Card title="Solde Gems" value={summary ? fmtAmount(summary.balanceGems) : '—'} tone="text-slate-900" />
        <Card
          title="Commissions cumulées (Coins)"
          value={summary ? fmtAmount(summary.lifetimeCommissionCoins) : '—'}
          tone="text-emerald-700"
        />
        <Card
          title="Escrow en cours (Coins)"
          value={summary ? fmtAmount(summary.openEscrowCoins) : '—'}
          tone="text-sky-700"
          sub={summary ? `Dernier snapshot : ${new Date(summary.lastSnapshotAt).toLocaleString('fr-FR')}` : undefined}
        />
      </section>

      {/* Action de reversal */}
      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Reverser une écriture</h2>
        <div className="flex flex-col gap-2 md:flex-row">
          <input
            value={reverseTarget}
            onChange={(e) => setReverseTarget(e.target.value)}
            placeholder="ID de la transaction d'origine"
            className="flex-1 rounded border border-slate-300 px-3 py-1.5 font-mono text-sm"
          />
          <input
            value={reverseReason}
            onChange={(e) => setReverseReason(e.target.value)}
            placeholder="Motif (obligatoire, audité)"
            className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm"
          />
          <button
            onClick={() => void reverse()}
            disabled={busy || !reverseTarget || !reverseReason}
            className="rounded bg-rose-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-50"
          >
            {busy ? 'Envoi…' : 'Créer un avoir'}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Le reversal n&apos;efface jamais l&apos;écriture d&apos;origine : il ajoute une contre-partie liée
          (journal append-only, docs/observability.md).
        </p>
      </section>

      {/* Journal */}
      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Devise</th>
              <th className="px-4 py-3 text-right">Montant</th>
              <th className="px-4 py-3">Marché lié</th>
              <th className="px-4 py-3">Tx</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!summary && txs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Chargement…
                </td>
              </tr>
            ) : txs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Aucune écriture.
                </td>
              </tr>
            ) : (
              txs.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{new Date(t.createdAt).toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_STYLE[t.type] ?? 'bg-slate-100 text-slate-600'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.currency}</td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${t.amount >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
                  >
                    {t.amount >= 0 ? '+' : ''}
                    {fmtAmount(t.amount)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{t.marketId ? `${t.marketId.slice(0, 12)}…` : '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{t.id.slice(0, 12)}…</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Card({ title, value, tone, sub }: { title: string; value: string; tone: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-slate-400">{title}</div>
      <div className={`mt-1 text-2xl font-bold ${tone}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}
