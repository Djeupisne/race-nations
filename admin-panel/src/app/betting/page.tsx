// Race Nations — Page admin : liste des marchés de paris en cours.
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { bettingApi, BetMarketRow, ApiError, fmtAmount } from '@/lib/api';

const STATUTS = ['', 'OPEN', 'CHALLENGED', 'LOCKED', 'SETTLING', 'DISPUTED', 'SETTLED', 'CANCELLED'] as const;

const badge: Record<string, string> = {
  OPEN: 'bg-emerald-100 text-emerald-800',
  CHALLENGED: 'bg-sky-100 text-sky-800',
  LOCKED: 'bg-amber-100 text-amber-800',
  SETTLING: 'bg-violet-100 text-violet-800',
  SETTLED: 'bg-slate-200 text-slate-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
  DISPUTED: 'bg-red-100 text-red-800 ring-1 ring-red-300',
};

export default function BettingAdminPage() {
  const [status, setStatus] = useState<string>('');
  const [rows, setRows] = useState<BetMarketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bettingApi.listMarkets(status || undefined, 50);
      setRows(res.items ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? `${e.code} — ${e.message}` : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Paris en cours</h1>
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm"
            aria-label="Filtrer par statut"
          >
            {STATUTS.map((s) => (
              <option key={s} value={s}>
                {s === '' ? 'Tous statuts' : s}
              </option>
            ))}
          </select>
          <button
            onClick={() => void load()}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Rafraîchir
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Marché</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Piste</th>
              <th className="px-4 py-3">Pool total</th>
              <th className="px-4 py-3">Répartition S0 / S1</th>
              <th className="px-4 py-3">Commission</th>
              <th className="px-4 py-3">Clôture</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  Chargement…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  Aucun marché pour ce filtre.
                </td>
              </tr>
            ) : (
              rows.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-slate-500">{m.id.slice(0, 12)}…</div>
                    <div className="text-slate-800">
                      {m.type} · {m.currency}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge[m.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{m.trackId}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{fmtAmount(m.totalPool)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {fmtAmount(m.side0Stake)} / {fmtAmount(m.side1Stake)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{(m.commissionBps / 100).toFixed(2)} %</td>
                  <td className="px-4 py-3 text-slate-600">{new Date(m.closesAt).toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Link
                        href={`/betting/${m.id}`}
                        className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
                      >
                        Détail
                      </Link>
                      {(m.status === 'LOCKED' || m.status === 'SETTLING' || m.status === 'DISPUTED') && (
                        <Link
                          href={`/betting/${m.id}/settle`}
                          className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500"
                        >
                          Clôturer
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        INV-04 : aucune clôture automatique sans verdict serveur ; les marchés DISPUTED nécessitent une résolution
        explicite (REFUND_ALL / UPHELD) depuis la page de règlement.
      </p>
    </main>
  );
}
