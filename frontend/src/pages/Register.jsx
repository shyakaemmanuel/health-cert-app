import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, AlertCircle } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('Password must be at least 8 characters');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      await register(form.email, form.password, form.full_name);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-primary-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 mt-1">Start verifying health certificates</p>
        </div>
        {error && <div className="flex items-center gap-2 bg-danger-500/10 text-danger-600 p-3 rounded-lg mb-4 text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" required value={form.full_name} onChange={e => update('full_name', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" required value={form.email} onChange={e => update('email', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><input type="password" required value={form.password} onChange={e => update('password', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label><input type="password" required value={form.confirm} onChange={e => update('confirm', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" /></div>
          <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">{loading ? 'Creating...' : 'Create Account'}</button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">Already have an account? <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link></p>
      </div>
    </div>
  );
}
