import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, User, Lock } from 'lucide-react';

export default function AdminRegistration() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // if (!isAdmin) {
    //   setError('Only existing admins can register new admins');
    //   return;
    // }
    
    setError(null);
    setLoading(true);
    setSuccess(false);

    try {
      // 1. Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      // 2. Add the user to the admins table
      const { error: adminError } = await supabase
        .from('admins')
        .insert([
          {
            id: authData.user.id,
            email,
            name,
          },
        ]);

      if (adminError) {
        throw adminError;
      }

      setSuccess(true);
      setEmail('');
      setPassword('');
      setName('');
    } catch (err: any) {
      console.error('Error registering admin:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Registration</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-md px-4 py-10 mx-auto sm:px-6 lg:px-8">
        <div className="p-8 bg-white shadow-md rounded-xl">
          <h2 className="mb-6 text-xl font-semibold text-gray-800">Register New Admin</h2>
          
          {error && (
            <div className="p-4 mb-6 border-l-4 border-red-500 bg-red-50">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {success && (
            <div className="p-4 mb-6 border-l-4 border-green-500 bg-green-50">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    Admin registered successfully! They can now log in.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block mb-1 text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full p-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full p-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="admin@example.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full p-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 6 characters long
              </p>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading }
                className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {loading ? 'Registering...' : 'Register Admin'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}