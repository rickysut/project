import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
}

type AdminRole = {
  role: number;
};

export default function Layout({ children }: LayoutProps) {
  const [showSidebar, setShowSidebar] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user?.email) return;

      const { data, error } = await supabase
        .from('admins')
        .select('role')
        .eq('email', user.email)
        .single<AdminRole>();

      if (!error && data) {
        setShowSidebar(data.role === 1);
      }
    };

    checkUserRole();
  }, [user]);

  return (
    <div className="flex h-screen bg-gray-100">
      {showSidebar && <Sidebar />}
      <div className="flex-1 overflow-auto">
        <main className="h-full">
          {children}
        </main>
      </div>
    </div>
  );
}
