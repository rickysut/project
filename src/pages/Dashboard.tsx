import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Database } from '../types/supabase';
import { Search, User, Phone, MapPin, Calendar, Mail } from 'lucide-react';

type Jemaat = Database['public']['Tables']['jemaat']['Row'];

export default function Dashboard() {
  const [jemaatList, setJemaatList] = useState<Jemaat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, signOut } = useAuth();

  useEffect(() => {
    fetchJemaat();
  }, []);

  async function fetchJemaat() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jemaat')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setJemaatList(data);
      }
    } catch (error) {
      console.error('Error fetching jemaat data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredJemaat = jemaatList.filter(
    (jemaat) =>
      jemaat.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (jemaat.phone && jemaat.phone.includes(searchTerm))
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Daftar Jemaat</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user?.email}
            </span>
            <button
              onClick={() => signOut()}
              className="px-3 py-1 text-sm text-red-700 bg-red-100 rounded-md hover:bg-red-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <h2 className="text-xl font-semibold text-gray-800">Jemaat List</h2>
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search jemaat..."
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center my-12">
            <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredJemaat.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-lg shadow">
            <p className="text-gray-500">No jemaat records found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredJemaat.map((jemaat) => (
              <div key={jemaat.id} className="overflow-hidden bg-white rounded-lg shadow">
                <div className="px-4 py-3 bg-slate-100">
                <div className="flex items-center mb-4 space-x-4">
                    {jemaat.photo ? (
                      <img
                        src={jemaat.photo}
                        alt={jemaat.full_name}
                        className="object-cover w-24 h-24"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full">
                        <span className="text-2xl text-gray-500">
                          {jemaat.full_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{jemaat.full_name}</h3>
                    </div>
                    <p className="text-sm">
                        Tgl daftar {new Date(jemaat.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-gray-700">{jemaat.phone || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div className="flex items-center">
                      <div>
                        <p className="text-sm text-gray-500">Tgl. Lahir</p>
                        <p className="text-gray-700">{formatDate(jemaat.birthday)}</p>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-gray-500">Umur</p>
                        <p className="text-gray-700">{jemaat.age || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Alamat</p>
                      <p className="text-gray-700">{jemaat.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}