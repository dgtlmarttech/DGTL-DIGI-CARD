'use client';
import React, { useEffect, useState } from 'react';
import Sidebar from '../../../components/admin/sidebar';
import { auth } from '../../../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { signOutUser } from '../../../services/firebaseAuthService';

const AdminLayout = ({ children }) => {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        user.getIdTokenResult().then((idTokenResult) => {
          if (idTokenResult.claims.admin) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            router.push('/admin');
          }
        });
      } else {
        setIsAdmin(false);
        router.push('/admin');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!isAdmin) {
    // Optionally show a loading spinner or an empty page
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-full w-full">
      <Sidebar onLogout={signOutUser}/>
      <div className='flex-1'>
        {children}
      </div> 
    </div>
  );
};

export default AdminLayout;