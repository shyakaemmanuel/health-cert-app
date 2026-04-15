import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../api';
import { ScanLine, CheckCircle, XCircle, AlertTriangle, Camera } from 'lucide-react';

export default function Verify() {
  const [result, setResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);
  const containerRef = useRef(null);

  const verify = async (qrData) => {
    setLoading(true);
    try {
      const { data } = await api.post('/certificates/verify', { qr_data: qrData });
      setResult(data);
    } catch (err) {
      setResult({ valid: false, result: 'invalid', message: 'Verification failed' });
    } finally { setLoading(false); }
  };

  const startScanner = async () => {
    setResult(null);
    setScanning(true);
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => { scanner.stop().catch(() => {}); setScanning(false); verify(decoded); },
        () => {}
      );
    } catch (err) { console.error(err); setScanning(false); }
  };

  const stopScanner = () => {
    if (scannerRef.current) scannerRef.current.stop().catch(() => {});
    setScanning(false);
  };

  useEffect(() => () => { if (scannerRef.current) scannerRef.current.stop().catch(() => {}); }, []);

  const handleManual = (e) => { e.preventDefault(); if (manualCode.trim()) verify(manualCode.trim()); };

  const icon = result?.result === 'valid' ? <CheckCircle className="w-16 h-16 text-success-500" /> : result?.result === 'expired' ? <AlertTriangle className="w-16 h-16 text-warning-500" /> : <XCircle className="w-16 h-16 text-danger-500" />;
  const bg = result?.result === 'valid' ? 'border-success-500 bg-success-500/5' : result?.result === 'expired' ? 'border-warning-500 bg-warning-500/5' : 'border-danger-500 bg-danger-500/5';

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <ScanLine className="w-12 h-12 text-primary-600 mx-auto mb-3" />
        <h1 className="text-3xl font-bold text-gray-900">Verify Certificate</h1>
        <p className="text-gray-500 mt-2">Scan a QR code or enter the code manually</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex gap-3 mb-6">
          {!scanning ? (
            <button onClick={startScanner} className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700"><Camera className="w-5 h-5" /> Scan QR Code</button>
          ) : (
            <button onClick={stopScanner} className="flex-1 bg-danger-500 text-white py-3 rounded-lg font-medium hover:bg-danger-600">Stop Scanner</button>
          )}
        </div>
        <div id="qr-reader" className={`mb-6 rounded-lg overflow-hidden ${scanning ? '' : 'hidden'}`}></div>
        <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div><div className="relative flex justify-center"><span className="bg-white px-3 text-sm text-gray-400">or enter manually</span></div></div>
        <form onSubmit={handleManual} className="mt-6 flex gap-3">
          <input value={manualCode} onChange={e => setManualCode(e.target.value)} placeholder="HEALTH-CERT:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
          <button type="submit" disabled={loading} className="bg-primary-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 shrink-0">{loading ? '...' : 'Verify'}</button>
        </form>
      </div>

      {result && (
        <div className={`rounded-2xl border-2 p-8 text-center ${bg}`}>
          <div className="flex justify-center mb-4">{icon}</div>
          <h2 className="text-2xl font-bold mb-2 capitalize">{result.result}</h2>
          {result.certificate ? (
            <div className="text-left mt-6 space-y-2 max-w-sm mx-auto">
              <div className="flex justify-between"><span className="text-gray-500">Holder</span><span className="font-medium">{result.certificate.holder_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium">{result.certificate.certificate_type}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Issuer</span><span className="font-medium">{result.certificate.issuer}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Issued</span><span className="font-medium">{result.certificate.issued_date}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Expires</span><span className="font-medium">{result.certificate.expiry_date}</span></div>
            </div>
          ) : (
            <p className="text-gray-500">{result.message || 'Certificate not found in the system'}</p>
          )}
        </div>
      )}
    </div>
  );
}
