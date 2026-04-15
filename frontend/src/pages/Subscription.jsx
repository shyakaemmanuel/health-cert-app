import { useState, useEffect } from 'react';
import api from '../api';
import { Crown, Check } from 'lucide-react';

const PLANS = [
  { id: 'free', name: 'Free', price: '$0', certs: 5, features: ['5 certificates', 'QR code generation', 'Basic verification'] },
  { id: 'basic', name: 'Basic', price: '$9.99/mo', certs: 25, features: ['25 certificates', 'QR code generation', 'Priority verification', 'Email support'] },
  { id: 'premium', name: 'Premium', price: '$29.99/mo', certs: 100, features: ['100 certificates', 'QR code generation', 'Priority verification', 'Phone & email support', 'API access'] },
];

export default function Subscription() {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState('');

  useEffect(() => {
    api.get('/subscriptions').then(({ data }) => setSub(data)).catch(() => {});
  }, []);

  const upgrade = async (plan) => {
    setLoading(plan);
    try {
      const { data } = await api.put('/subscriptions/upgrade', { plan });
      setSub(data);
    } catch (err) { console.error(err); }
    finally { setLoading(''); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <Crown className="w-12 h-12 text-primary-600 mx-auto mb-3" />
        <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-500 mt-2">Current plan: <span className="font-semibold text-primary-600 capitalize">{sub?.plan || '...'}</span></p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map(p => (
          <div key={p.id} className={`bg-white rounded-2xl shadow-lg p-6 border-2 ${sub?.plan === p.id ? 'border-primary-500' : 'border-transparent'}`}>
            <h3 className="text-xl font-bold text-gray-900">{p.name}</h3>
            <p className="text-3xl font-bold text-primary-600 mt-2">{p.price}</p>
            <ul className="mt-6 space-y-3">
              {p.features.map(f => <li key={f} className="flex items-center gap-2 text-sm text-gray-600"><Check className="w-4 h-4 text-success-500 shrink-0" />{f}</li>)}
            </ul>
            <button
              onClick={() => upgrade(p.id)}
              disabled={sub?.plan === p.id || p.id === 'free' || loading === p.id}
              className="w-full mt-6 py-2.5 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed bg-primary-600 text-white hover:bg-primary-700"
            >{sub?.plan === p.id ? 'Current Plan' : loading === p.id ? 'Upgrading...' : `Upgrade to ${p.name}`}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
