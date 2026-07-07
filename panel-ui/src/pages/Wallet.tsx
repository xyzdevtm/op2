import { useEffect, useState } from 'react';
import api from '@/config/api';
import { useLang } from '@/i18n/LanguageContext';
import StatCard from '@/components/StatCard';
import { WalletIcon, CreditCardIcon, CoinsIcon, ArrowLeftIcon, ClockIcon } from '@/components/Icons';

export default function Wallet() {
  const { t, locale } = useLang();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [depositAmount, setDepositAmount] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [walletRes, txRes] = await Promise.all([api.get('/wallet'), api.get('/wallet/transactions')]);
    setWallet(walletRes.data);
    setTransactions(txRes.data.transactions || []);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(depositAmount);
    if (amount > 0) {
      await api.post('/wallet/deposit', { amount });
      setDepositAmount('');
      loadData();
    }
  };

  const dateLocale = locale === 'fa' ? 'fa-IR' : 'en-US';

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{t('nav.wallet')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<WalletIcon size={18} />} label={t('wallet.balance')} value={wallet?.balance?.toLocaleString() || '0'} subValue={t('wallet.coins')} accent="#22c55e" />
        <StatCard icon={<CoinsIcon size={18} />} label={t('wallet.totalDeposited')} value={wallet?.totalDeposited?.toLocaleString() || '0'} subValue={t('wallet.allTime')} accent="#22c55e" />
        <StatCard icon={<CreditCardIcon size={18} />} label={t('wallet.totalSpent')} value={wallet?.totalSpent?.toLocaleString() || '0'} subValue={t('wallet.allTime')} accent="#ef4444" />
      </div>

      <div className="neu-flat p-5">
        <h2 className="text-sm font-medium uppercase tracking-wide mb-3" style={{ color: 'var(--text-secondary)' }}>{t('wallet.quickDeposit')}</h2>
        <form onSubmit={handleDeposit} className="flex flex-col sm:flex-row gap-3">
          <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder={t('wallet.amount')}
            className="neu-input flex-1 px-4 py-2.5 text-sm" min="1" />
          <button type="submit" className="neu-btn-primary px-6 py-2.5 text-sm whitespace-nowrap">
            {t('wallet.deposit')}
          </button>
        </form>
      </div>

      <div className="neu-flat overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>{t('wallet.txHistory')}</h2>
        </div>
        {transactions.length === 0 ? (
          <div className="p-10 text-center">
            <CoinsIcon size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('wallet.noTransactions')}</p>
          </div>
        ) : (
          <div>
            {transactions.map((tx: any, i: number) => (
              <div key={tx._id || i} className="px-5 py-3 flex items-center justify-between transition table-row-hover"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.amount > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}
                    style={{ background: tx.amount > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', boxShadow: 'var(--shadow-neu-sm)' }}>
                    <ArrowLeftIcon size={16} className={tx.amount > 0 ? 'rotate-180' : ''} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{tx.description || tx.type}</p>
                    <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <ClockIcon size={11} />
                      <span>{new Date(tx.createdAt).toLocaleDateString(dateLocale)}</span>
                    </div>
                  </div>
                </div>
                <span className="text-sm font-semibold" style={{ color: tx.amount > 0 ? '#22c55e' : '#ef4444' }}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
