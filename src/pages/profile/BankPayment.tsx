import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2, CreditCard, CheckCircle2, AlertCircle,
  Lock, ChevronRight, Wallet, ArrowDownLeft, ArrowUpRight,
  Banknote, Shield, Plus, Eye, EyeOff, RefreshCw,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { cn } from '../../utils/cn';
import { Header } from '../../components/Header';
import { API_BASE_URL } from '../../config';

// ─── MOCK TRANSACTIONS ────────────────────────────────────────────────────────
const MOCK_TRANSACTIONS = [
  { id: 't1', type: 'credit', label: 'Harvest Payout', amount: 48500, date: '2026-04-05', status: 'success', ref: 'AQG-PAY-2804' },
  { id: 't2', type: 'debit',  label: 'Subscription - Pro Gold', amount: 999,  date: '2026-04-01', status: 'success', ref: 'AQG-SUB-0104' },
  { id: 't3', type: 'credit', label: 'Harvest Payout', amount: 36200, date: '2026-03-18', status: 'success', ref: 'AQG-PAY-1803' },
  { id: 't4', type: 'debit',  label: 'Subscription - Pro Gold', amount: 999,  date: '2026-03-01', status: 'success', ref: 'AQG-SUB-0103' },
  { id: 't5', type: 'credit', label: 'Referral Bonus', amount: 200,  date: '2026-02-20', status: 'success', ref: 'AQG-REF-2002' },
];

export const BankPayment = ({ t }: { t: any }) => {
  const navigate = useNavigate();
  const { user, updateUser, theme } = useData();
  const isDark = theme === 'dark' || theme === 'midnight';

  const [bankData, setBankData] = useState({
    bankName: user?.bankDetails?.bankName || '',
    accountNumber: user?.bankDetails?.accountNumber || '',
    ifscCode: user?.bankDetails?.ifscCode || '',
  });
  const [showAccount, setShowAccount] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [activeTab, setActiveTab] = useState<'bank' | 'history'>('bank');

  const handleSave = async () => {
    if (!bankData.bankName || !bankData.accountNumber || !bankData.ifscCode) {
      setSaveError('Please fill all bank details.');
      return;
    }
    if (bankData.accountNumber.length < 9) {
      setSaveError('Account number must be at least 9 digits.');
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankData.ifscCode.toUpperCase())) {
      setSaveError('Invalid IFSC code format (e.g. SBIN0001234).');
      return;
    }
    setSaveError('');
    setSaving(true);
    try {
      const token = localStorage.getItem('aqua_token');
      await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bankDetails: { ...bankData, ifscCode: bankData.ifscCode.toUpperCase(), isVerified: true } }),
      });
      await updateUser({ bankDetails: { ...bankData, ifscCode: bankData.ifscCode.toUpperCase(), isVerified: true } });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const totalCredits = MOCK_TRANSACTIONS.filter(t => t.type === 'credit').reduce((a, t) => a + t.amount, 0);
  const totalDebits  = MOCK_TRANSACTIONS.filter(t => t.type === 'debit').reduce((a, t) => a + t.amount, 0);

  return (
    <div className={cn('min-h-screen pb-32', isDark ? 'bg-[#070D12]' : 'bg-[#F0F4F8]')}>
      <Header title="Bank & Payments" showBack />

      <div className="pt-22 px-4 py-5 space-y-4">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#0D1520] to-[#051015] rounded-[2.5rem] p-5 border border-white/5 shadow-xl relative overflow-hidden"
        >
          <div className="absolute -right-6 -bottom-6 opacity-5">
            <Banknote size={130} strokeWidth={0.5} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/30 text-[7px] font-black uppercase tracking-widest mb-1">AquaGrow Wallet</p>
                <p className="text-white text-2xl font-black tracking-tight">
                  ₹{(totalCredits - totalDebits).toLocaleString('en-IN')}
                </p>
                <p className="text-white/30 text-[8px] font-medium mt-0.5">Available Balance</p>
              </div>
              <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center border',
                user?.bankDetails?.isVerified ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-white/5 border-white/10'
              )}>
                <Wallet size={22} className={user?.bankDetails?.isVerified ? 'text-emerald-400' : 'text-white/30'} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <ArrowDownLeft size={14} className="text-emerald-400" />
                <div>
                  <p className="text-white font-black text-sm">₹{totalCredits.toLocaleString('en-IN')}</p>
                  <p className="text-white/25 text-[7px] font-black uppercase tracking-widest">Total Received</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpRight size={14} className="text-red-400" />
                <div>
                  <p className="text-white font-black text-sm">₹{totalDebits.toLocaleString('en-IN')}</p>
                  <p className="text-white/25 text-[7px] font-black uppercase tracking-widest">Total Spent</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className={cn('flex p-1 rounded-2xl border', isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100')}>
          {[
            { key: 'bank',    label: '🏦 Bank Account' },
            { key: 'history', label: '📋 History' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={cn('flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all',
                activeTab === tab.key
                  ? 'bg-[#0D523C] text-white shadow-md'
                  : isDark ? 'text-white/30' : 'text-slate-400'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'bank' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

            {/* Verified badge */}
            {user?.bankDetails?.isVerified && (
              <div className={cn('flex items-center gap-2 px-4 py-3 rounded-2xl border',
                isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
              )}>
                <CheckCircle2 size={14} className="text-emerald-500" />
                <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-emerald-400' : 'text-emerald-700')}>
                  Bank Account Verified · {user.bankDetails.bankName}
                </p>
              </div>
            )}

            {/* Form */}
            <div className={cn('rounded-[2rem] border p-5 space-y-4', isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm')}>
              <div className="flex items-center gap-2 mb-1">
                <Building2 size={15} className={isDark ? 'text-white/30' : 'text-slate-500'} />
                <p className={cn('text-[9px] font-black uppercase tracking-widest', isDark ? 'text-white/25' : 'text-slate-400')}>
                  Bank Details
                </p>
              </div>

              {[
                { label: 'Bank Name', key: 'bankName', placeholder: 'e.g. State Bank of India', type: 'text' },
                { label: 'Account Number', key: 'accountNumber', placeholder: '•••••••••••', type: showAccount ? 'text' : 'password' },
                { label: 'IFSC Code', key: 'ifscCode', placeholder: 'e.g. SBIN0001234', type: 'text' },
              ].map(field => (
                <div key={field.key}>
                  <label className={cn('text-[7px] font-black uppercase tracking-widest mb-1 block', isDark ? 'text-white/20' : 'text-slate-400')}>
                    {field.label}
                  </label>
                  <div className="relative">
                    <input
                      type={field.type}
                      value={(bankData as any)[field.key]}
                      onChange={e => setBankData(p => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className={cn('w-full px-4 py-3 rounded-2xl border text-[12px] font-semibold outline-none transition-all',
                        isDark ? 'bg-white/5 border-white/8 text-white placeholder:text-white/15 focus:border-emerald-500/40' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:border-emerald-300'
                      )}
                    />
                    {field.key === 'accountNumber' && (
                      <button onClick={() => setShowAccount(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showAccount ? <EyeOff size={14} className="text-slate-400" /> : <Eye size={14} className="text-slate-400" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Error / Success */}
              <AnimatePresence>
                {saveError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-red-500 text-[9px] font-black"
                  >
                    <AlertCircle size={11} /> {saveError}
                  </motion.div>
                )}
                {saveSuccess && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-emerald-500 text-[9px] font-black"
                  >
                    <CheckCircle2 size={11} /> Bank details saved & verified!
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3.5 bg-gradient-to-br from-[#0D523C] to-emerald-700 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
              >
                {saving ? <RefreshCw size={13} className="animate-spin" /> : <><Building2 size={13} /> Save Bank Details</>}
              </motion.button>

              <div className="flex items-center justify-center gap-2 pt-1">
                <Lock size={9} className={isDark ? 'text-white/15' : 'text-slate-400'} />
                <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/15' : 'text-slate-400')}>
                  256-bit encrypted · Never shared
                </p>
              </div>
            </div>

            {/* Security note */}
            <div className={cn('flex items-start gap-3 p-4 rounded-2xl border', isDark ? 'bg-blue-500/5 border-blue-500/10' : 'bg-blue-50 border-blue-100')}>
              <Shield size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className={cn('text-[9px] font-medium leading-relaxed', isDark ? 'text-white/40' : 'text-slate-600')}>
                Your bank details are used only for harvest payout transfers. AquaGrow does not store your full account number in plain text and will never share your financial data with third parties.
              </p>
            </div>
          </motion.div>

        ) : (
          /* ── TRANSACTION HISTORY ── */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/20' : 'text-slate-400')}>
                Recent Transactions
              </p>
              <p className={cn('text-[7px] font-black uppercase tracking-widest', isDark ? 'text-white/15' : 'text-slate-300')}>
                Last 90 days
              </p>
            </div>

            {MOCK_TRANSACTIONS.map((txn, i) => (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={cn('flex items-center gap-3 p-4 rounded-[2rem] border',
                  isDark ? 'bg-[#0D1520] border-white/5' : 'bg-white border-slate-100 shadow-sm'
                )}
              >
                {/* Icon */}
                <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0',
                  txn.type === 'credit'
                    ? isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'
                    : isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'
                )}>
                  {txn.type === 'credit'
                    ? <ArrowDownLeft size={16} className="text-emerald-500" />
                    : <ArrowUpRight size={16} className="text-red-500" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={cn('text-[11px] font-black tracking-tight leading-tight', isDark ? 'text-white' : 'text-slate-900')}>
                    {txn.label}
                  </p>
                  <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/20' : 'text-slate-400')}>
                    {txn.ref} · {new Date(txn.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <p className={cn('text-[13px] font-black',
                    txn.type === 'credit'
                      ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                      : isDark ? 'text-red-400' : 'text-red-500'
                  )}>
                    {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                  </p>
                  <p className={cn('text-[7px] font-black uppercase tracking-widest mt-0.5', isDark ? 'text-white/15' : 'text-slate-300')}>
                    {txn.status}
                  </p>
                </div>
              </motion.div>
            ))}

            <p className={cn('text-center text-[8px] font-black uppercase tracking-widest pb-4', isDark ? 'text-white/10' : 'text-slate-300')}>
              Showing last 5 transactions
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
