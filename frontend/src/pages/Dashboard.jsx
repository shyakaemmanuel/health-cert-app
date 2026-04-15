import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Plus, QrCode, FileCheck, AlertCircle, X } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [certs, setCerts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [qrModal, setQrModal] = useState(null);
  const [form, setForm] = useState({ certificate_type: '', issued_date: '', expiry_date: '', issuer: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchCerts(); }, []);

  const fetchCerts = async () => {
    try { const { data } = await api.get('/certificates'); setCerts(data); } catch (e) { console.error(e); }
  };

  const createCert = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { data } = await api.post('/certificates', form);
      setQrModal(data.qr_code);
      setShowForm(false); setForm({ certificate_type: '', issued_date: '', expiry_date: '', issuer: '' });
      fetchCerts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create certificate');
    } finally { setLoading(false); }
  };

  const showQr = async (id) => {
    try { const { data } = await api.get(`/certificates/${id}/qr`); setQrModal(data.qr_code); } catch (e) { console.error(e); }
  };

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const statusColor = (s) => s === 'active' ? 'bg-success-500/10 text-success-600' : s === 'expired' ? 'bg-warning-500/10 text-warning-600' : 'bg-danger-500/10 text-danger-600';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome, {user?.full_name}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 font-medium">
          <Plus className="w-4 h-4" /> New Certificate
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Create Certificate</h2>
          {error && <div className="flex items-center gap-2 bg-danger-500/10 text-danger-600 p-3 rounded-lg mb-4 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}
          <form onSubmit={createCert} className="grid md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Certificate Type</label><input required value={form.certificate_type} onChange={e => update('certificate_type', e.target.value)} placeholder="e.g. COVID-19 Vaccination" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Issuer</label><input required value={form.issuer} onChange={e => update('issuer', e.target.value)} placeholder="e.g. WHO" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Issued Date</label><input type="date" required value={form.issued_date} onChange={e => update('issued_date', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label><input type="date" required value={form.expiry_date} onChange={e => update('expiry_date', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary-500" /></div>
            <div className="md:col-span-2"><button type="submit" disabled={loading} className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">{loading ? 'Creating...' : 'Create & Generate QR'}</button></div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b"><h2 className="font-semibold text-gray-900 flex items-center gap-2"><FileCheck className="w-5 h-5" /> Your Certificates</h2></div>
        {certs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No certificates yet. Create your first one above.</div>
        ) : (
          <div className="divide-y">
            {certs.map(c => (
              <div key={c.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{c.certificate_type}</p>
                  <p className="text-sm text-gray-500">{c.issuer} · Issued {c.issued_date} · Expires {c.expiry_date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor(c.status)}`}>{c.status}</span>
                  <button onClick={() => showQr(c.id)} className="text-primary-600 hover:text-primary-700"><QrCode className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {qrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end"><button onClick={() => setQrModal(null)}><X className="w-5 h-5 text-gray-400" /></button></div>
            <h3 className="text-lg font-semibold mb-4">Certificate QR Code</h3>
            <img src={qrModal} alt="QR Code" className="mx-auto mb-4" />
            <p className="text-sm text-gray-500">Scan this QR code to verify the certificate</p>
          </div>
        </div>
      )}
    </div>
  );
}
