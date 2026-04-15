import { Link } from 'react-router-dom';
import { Shield, ScanLine, QrCode, Lock } from 'lucide-react';

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Health Certificate Verification</h1>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">Secure, instant verification of health certificates using QR codes. Trusted by healthcare providers worldwide.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/verify" className="bg-white text-primary-700 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50">Verify Certificate</Link>
            <Link to="/register" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10">Get Started</Link>
          </div>
        </div>
      </section>
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { icon: QrCode, title: 'QR Code Generation', desc: 'Generate unique QR codes for each health certificate for easy scanning and verification.' },
            { icon: ScanLine, title: 'Instant Verification', desc: 'Scan any certificate QR code and get instant verification results with full details.' },
            { icon: Lock, title: 'Secure & Tamper-Proof', desc: 'All certificates are cryptographically secured and tamper-proof for maximum trust.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-xl shadow-md p-6 text-center">
              <Icon className="w-10 h-10 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
