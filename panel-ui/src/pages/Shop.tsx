import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/config/api';
import { useLang } from '@/i18n/LanguageContext';
import { ShoppingBagIcon, SpinnerIcon, PaletteIcon } from '@/components/Icons';

export default function Shop() {
  const { t } = useLang();
  const [items, setItems] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/shop/items').then((res) => setItems(res.data)).catch(() => toast.error(t('shop.loadFailed'))).finally(() => setLoading(false));
  }, []);

  const handlePurchase = async (item: any) => {
    try {
      const res = await api.post('/shop/purchase', { cosmeticType: item.type || 'pattern', cosmeticName: item.name, price: item.price || 100 });
      const flare = res.data?.flare;
      toast.success(
        flare
          ? `${t('shop.purchaseSuccess')} (${flare})`
          : t('shop.purchaseSuccess'),
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('shop.purchaseFailed'));
    }
  };

  const shopItems = items ? (items.patterns || items.flags || []).slice(0, 12) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <SpinnerIcon size={24} className="text-[#3b82f6]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{t('nav.shop')}</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('shop.purchaseDesc')}</p>
      </div>

      <div className="neu-flat p-5">
        <h2 className="text-sm font-medium uppercase tracking-wide mb-4" style={{ color: 'var(--text-secondary)' }}>{t('shop.availableCosmetics')}</h2>
        {shopItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {shopItems.map((item: any, i: number) => (
              <div key={i} className="neu-raised p-3 transition">
                <div className="h-24 rounded-xl mb-3 flex items-center justify-center" style={{ background: 'var(--bg-primary)', boxShadow: 'var(--shadow-neu-inset)' }}>
                  <PaletteIcon size={28} style={{ color: 'var(--text-muted)' }} />
                </div>
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.name || item}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.type || 'cosmetic'}</p>
                <button onClick={() => handlePurchase(item)} className="neu-btn-primary w-full mt-2.5 py-1.5 text-xs">
                  {t('shop.purchase')} — {(item.price || 100).toLocaleString()}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <ShoppingBagIcon size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('shop.apiNote')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
