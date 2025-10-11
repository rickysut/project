import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Lock, Mail } from 'lucide-react';

type AdminRole = {
  role: number;
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) throw signInError;

      // Check user role after successful login
      const { error: roleError } = await supabase
        .from('admins')
        .select('role')
        .eq('email', email)
        .single<AdminRole>();

      if (roleError) throw roleError;

      // Always redirect to dashboard, but the Layout component will handle
      // showing/hiding the sidebar based on the role
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gray-100 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white shadow-md rounded-xl">
        <div className="overflow-hidden bg-white rounded-t-lg">
          <img
            src="https://supabase.gedorapp.com/storage/v1/object/public/hg2/adulam.png"
            alt="Adullam Logo"
            className="object-contain w-full h-24 bg-white"
          />
        </div>

        <div className="px-10 pb-10">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-center text-gray-900">
              Admin HG2
            </h2>
          </div>

          {error && (
            <div className="p-4 mb-4 border-l-4 border-red-500 bg-red-50">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="-space-y-px rounded-md shadow-sm">
              <div className="mb-4">
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                  </div>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="relative block w-full px-3 py-2 pl-10 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="relative block w-full px-3 py-2 pl-10 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md group hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {loading ? (
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                  </span>
                ) : null}
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}