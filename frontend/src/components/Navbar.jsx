import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-700">
          <Shield className="w-6 h-6" /> HealthCert
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link to="/verify" className="text-gray-600 hover:text-primary-700 font-medium">Verify</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="text-gray-600 hover:text-primary-700 font-medium">Dashboard</Link>
              <Link to="/subscription" className="text-gray-600 hover:text-primary-700 font-medium">Subscription</Link>
              <button onClick={handleLogout} className="flex items-center gap-1 text-gray-500 hover:text-danger-600"><LogOut className="w-4 h-4" /> Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-primary-700 font-medium">Login</Link>
              <Link to="/register" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium">Sign Up</Link>
            </>
          )}
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <div className="md:hidden border-t px-4 py-3 space-y-2 bg-white">
          <Link to="/verify" onClick={() => setOpen(false)} className="block py-2">Verify</Link>
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setOpen(false)} className="block py-2">Dashboard</Link>
              <Link to="/subscription" onClick={() => setOpen(false)} className="block py-2">Subscription</Link>
              <button onClick={() => { handleLogout(); setOpen(false); }} className="block py-2 text-danger-600">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="block py-2">Login</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="block py-2">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
