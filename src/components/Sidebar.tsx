import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut, isAdmin } = useAuth();
  const location = useLocation();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      allowedFor: 'all',
    },
    {
      name: 'Register Admin',
      path: '/register-admin',
      icon: <Users className="w-5 h-5" />,
      allowedFor: 'all',
    },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.allowedFor === 'all' || (item.allowedFor === 'admin' && isAdmin)
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed z-50 lg:hidden top-4 left-4">
        <button
          onClick={toggleSidebar}
          className="p-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <h1 className="text-xl font-bold text-blue-600">Admin Panel</h1>
          <button 
            onClick={closeSidebar}
            className="p-1 text-gray-500 rounded-md hover:text-gray-700 lg:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="px-2 mt-5 space-y-1">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                location.pathname === item.path
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              onClick={closeSidebar}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <button
            onClick={() => {
              signOut();
              closeSidebar();
            }}
            className="flex items-center w-full px-2 py-2 text-base font-medium text-red-600 rounded-md group hover:bg-red-50"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}