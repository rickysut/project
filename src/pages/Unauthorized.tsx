import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-100">
      <div className="w-full max-w-md p-8 text-center bg-white rounded-lg shadow-md">
        <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="mb-6 text-gray-600">
          You don't have permission to access this page. Only administrators can access this area.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}