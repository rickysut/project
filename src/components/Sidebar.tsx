import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { signOut, isAdmin } = useAuth();
  const location = useLocation();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      allowedFor: 'all',
    },
    {
      name: 'Download Data',
      path: '/download-data',
      icon: <Download className="w-5 h-5" />,
      allowedFor: 'admin',
    },
    {
      name: 'Register Admin',
      path: '/register-admin',
      icon: <Users className="w-5 h-5" />,
      allowedFor: 'admin',
    },
  ];

  return (
    <div
      className={`bg-white shadow-lg transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      } min-h-screen relative`}
    >
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-4 bg-white rounded-full p-1 shadow-md"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      <div className="flex flex-col h-full">
        <div className={`p-4 ${isCollapsed ? 'items-center' : ''}`}>
          <h2 className={`font-bold text-xl ${isCollapsed ? 'hidden' : 'block'}`}>
            GBI
          </h2>
        </div>

        <nav className="flex-1">
          <ul className="space-y-2 p-2">
            {navItems.map((item) =>
              (item.allowedFor === 'all' || (item.allowedFor === 'admin' && isAdmin)) ? (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 ${
                      location.pathname === item.path ? 'bg-gray-100' : ''
                    }`}
                  >
                    <span>{item.icon}</span>
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              ) : null
            )}
          </ul>
        </nav>

        <div className="p-4">
          <button
            onClick={signOut}
            className={`flex items-center space-x-2 p-2 w-full rounded-lg hover:bg-red-100 text-red-600 ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );
}