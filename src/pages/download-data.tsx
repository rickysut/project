import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';

interface JemaatData {
  full_name: string;
  gender: string;
  age: number;
  phone: string;
  address: string;
  birthday: string;
  photo: string;
}

export default function DownloadData() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<number | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        navigate('/');
        return;
      }

      const { data: adminData, error } = await supabase
        .from('admins')
        .select('role')
        .eq('email', user.email)
        .single();

      if (error || !adminData || adminData.role !== 1) {
        navigate('/unauthorized');
        return;
      }

      setUserRole(adminData.role);
    };

    checkUserRole();
  }, [user, navigate]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return '';
    }
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 1) {
      alert('Unauthorized access');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Fetch data from Supabase
      const { data, error } = await supabase
        .from('jemaat')
        .select('full_name, gender, age, phone, address, birthday, photo')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw error;

      if (!data || data.length === 0) {
        setError('No data found for the selected date range');
        return;
      }

      // Transform the data to include thumbnail URLs and format dates
      const transformedData = data.map((item: JemaatData) => ({
        full_name: item.full_name || '',
        gender: item.gender || '',
        age: item.age || 0,
        phone: item.phone || '',
        address: item.address || '',
        birthday: item.birthday ? formatDate(item.birthday) : '',
        photo: item.photo ? `=HYPERLINK("${item.photo}"; "${item.full_name} photo")` : ''
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(transformedData, {
        header: ['full_name', 'gender', 'age', 'phone', 'address', 'birthday', 'photo']
      });

      // Add headers
      const headers = [
        'Nama Lengkap',
        'Jenis Kelamin',
        'Umur',
        'No. Telepon',
        'Alamat',
        'Tanggal Lahir',
        'Foto'
      ];

      // Modify the first row to use our custom headers
      XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A1' });

      // Style the headers (make them bold)
      for (let i = 0; i < headers.length; i++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
        if (!ws[cellRef]) ws[cellRef] = {};
        ws[cellRef].s = { font: { bold: true } };
      }

      // Set column widths
      const colWidths = [
        { wch: 25 }, // Nama Lengkap
        { wch: 15 }, // Jenis Kelamin
        { wch: 8 },  // Umur
        { wch: 15 }, // No. Telepon
        { wch: 40 }, // Alamat
        { wch: 12 }, // Tanggal Lahir
        { wch: 50 }, // Foto URL
      ];
      ws['!cols'] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Jemaat');

      // Generate Excel file
      XLSX.writeFile(wb, `data_jemaat_${startDate}_${endDate}.xlsx`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while downloading data');
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== 1) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Download Data Jemaat</h2>
        
        <form onSubmit={handleDownload} className="space-y-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Mulai
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Akhir
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Downloading...
              </>
            ) : (
              'Download Excel'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
