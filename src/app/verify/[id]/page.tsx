'use client';

import { useState, useEffect, use } from 'react';
import { ShieldCheck, CheckCircle2, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function VerifyReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReceipt() {
      try {
        setLoading(true);
        const res = await fetch(`/api/receipt/${id}`);
        if (!res.ok) {
          throw new Error('Receipt not found or still propagating on Gonka Network.');
        }
        const data = await res.json();
        setReceipt(data);
      } catch (err: any) {
        setError(err.message || 'Failed to connect to Gonka Network.');
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchReceipt();
    }
  }, [id]);

  return (
    <div className="min-h-screen bg-[#fbf8f3] text-[#2c2214] flex flex-col font-sans">
      <header className="border-b border-[#ebdcb8] bg-[#faf6ee] px-6 py-4 flex items-center justify-between shadow-xs">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-sm text-stone-700 hover:text-stone-900 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to CivicPulse</span>
        </Link>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Gonka Dual-AI Hedged Network</span>
        </div>
      </header>

      <main className="max-w-3xl w-full mx-auto p-6 my-8 space-y-6 flex-1">
        <div className="bg-white border border-[#ebdcb8] rounded-2xl p-6 sm:p-8 space-y-6 shadow-md">
          <div className="flex items-center gap-3 border-b border-stone-200 pb-5">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900 tracking-tight">Cryptographic Receipt Audit</h1>
              <p className="text-xs text-stone-500 font-mono mt-0.5">Run ID: {id}</p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-amber-700 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-stone-600">Verifying execution proof on Gonka Network...</p>
            </div>
          ) : error ? (
            <div className="p-5 border border-rose-200 bg-rose-50 rounded-xl space-y-2 text-rose-900">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertCircle className="h-5 w-5 text-rose-600" />
                <span>Verification Status</span>
              </div>
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                <CheckCircle2 className="h-4 w-4" />
                <span>Verified Execution Receipt Propagated</span>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Raw Execution Proof JSON</span>
                <pre className="p-4 rounded-xl bg-stone-900 text-emerald-400 text-xs font-mono overflow-x-auto max-h-96 border border-stone-800">
                  {JSON.stringify(receipt, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-[#ebdcb8] py-4 text-center text-xs text-stone-500 bg-[#faf6ee]">
        © 2026 CivicPulse • Verified via Gonka Network Dual-Model Consensus
      </footer>
    </div>
  );
}
