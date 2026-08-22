'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../../../../firebase/firebase';
import { collection, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { FiUsers, FiLink, FiPercent, FiSettings, FiCheck, FiX } from 'react-icons/fi';

export default function AdminReferralsPage() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'referralCodes')); // Without composite index, we sort in client for now
      const snap = await getDocs(q);
      
      const codesData = [];
      for (const d of snap.docs) {
        const data = d.data();
        // Fetch user basic info
        let userName = 'Unknown';
        const userQ = query(collection(db, 'users'), require('firebase/firestore').where('uid', '==', data.ownerUserId));
        const userSnap = await getDocs(userQ);
        if (!userSnap.empty) {
          const u = userSnap.docs[0].data();
          userName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
        }
        
        codesData.push({
          id: d.id,
          ...data,
          userName
        });
      }
      
      // Sort desc by date
      codesData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setCodes(codesData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load referral codes');
    } finally {
      setLoading(false);
    }
  };

  const toggleCodeStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
      await updateDoc(doc(db, 'referralCodes', id), {
        status: newStatus
      });
      setCodes(codes.map(c => c.id === id ? { ...c, status: newStatus } : c));
      toast.success(`Code ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Referral Codes</h1>
          <p className="text-slate-500">Manage all user referral codes and default commission rates.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Rate</th>
                <th className="px-6 py-4">Usage</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {codes.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-500">No referral codes found.</td></tr>
              ) : codes.map((code) => (
                <tr key={code.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-800">{code.userName}</td>
                  <td className="px-6 py-4 font-mono font-medium text-blue-600">{code.code}</td>
                  <td className="px-6 py-4">{code.commissionRate}%</td>
                  <td className="px-6 py-4">{code.usageCount || 0}</td>
                  <td className="px-6 py-4">{new Date(code.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      code.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {code.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => toggleCodeStatus(code.id, code.status)}
                      className={`text-xs px-3 py-1 rounded-md border ${
                        code.status === 'active' 
                          ? 'border-red-200 text-red-600 hover:bg-red-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {code.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
