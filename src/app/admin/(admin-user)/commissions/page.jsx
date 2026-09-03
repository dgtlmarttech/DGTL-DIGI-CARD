'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../../../../firebase/firebase';
import { collection, getDocs, getDoc, query, orderBy, updateDoc, doc, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { FiDollarSign, FiCheckCircle, FiXCircle, FiClock, FiRefreshCw, FiSearch } from 'react-icons/fi';

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'commissions'));
      const snap = await getDocs(q);
      
      const commData = [];
      for (const d of snap.docs) {
        const data = d.data();
        
        // Fetch Referrer Info
        let referrerName = 'Unknown';
        let referrerPhone = '';
        let referrerBankDetails = null;
        if (data.referrerUserId) {
          const userSnap = await getDoc(doc(db, 'users', data.referrerUserId));
          if (userSnap.exists()) {
            const u = userSnap.data();
            referrerName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
            referrerPhone = u.mobile || '';
            referrerBankDetails = u.bankDetails || null;
          } else {
            const userQ = query(collection(db, 'users'), where('uid', '==', data.referrerUserId));
            const userQS = await getDocs(userQ);
            if (!userQS.empty) {
              const u = userQS.docs[0].data();
              referrerName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
              referrerPhone = u.mobile || '';
              referrerBankDetails = u.bankDetails || null;
            } else {
              const affSnap = await getDoc(doc(db, 'affiliates', data.referrerUserId));
              if (affSnap.exists()) {
                const a = affSnap.data();
                referrerName = a.full_name || a.email || 'Affiliate';
                referrerPhone = a.phone || '';
              }
            }
          }
        }
        
        // Fetch Referred Info
        let referredName = 'Unknown';
        if (data.referredUserId) {
          const refUserSnap = await getDoc(doc(db, 'users', data.referredUserId));
          if (refUserSnap.exists()) {
            const ru = refUserSnap.data();
            referredName = `${ru.firstName || ''} ${ru.lastName || ''}`.trim() || ru.email;
          } else {
            const refUserQ = query(collection(db, 'users'), where('uid', '==', data.referredUserId));
            const refUserQS = await getDocs(refUserQ);
            if (!refUserQS.empty) {
              const ru = refUserQS.docs[0].data();
              referredName = `${ru.firstName || ''} ${ru.lastName || ''}`.trim() || ru.email;
            }
          }
        }

        commData.push({
          id: d.id,
          ...data,
          referrerName,
          referrerPhone,
          referredName,
          referrerBankDetails
        });
      }
      
      // Sort desc by date
      commData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setCommissions(commData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load commissions');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      if (newStatus === 'paid' && !window.confirm('Are you sure you want to mark this as Paid? You should have already transferred the money.')) return;
      
      await updateDoc(doc(db, 'commissions', id), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      setCommissions(commissions.map(c => c.id === id ? { ...c, status: newStatus } : c));
      toast.success(`Commission marked as ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'paid': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><FiCheckCircle className="mr-1"/> Paid</span>;
      case 'approved': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><FiCheckCircle className="mr-1"/> Approved</span>;
      case 'pending': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"><FiClock className="mr-1"/> Pending</span>;
      case 'reversed': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><FiXCircle className="mr-1"/> Reversed</span>;
      default: return <span>{status}</span>;
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Commissions Ledger</h1>
          <p className="text-slate-500">Track and payout referral commissions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search name or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 w-64"
            />
          </div>
          <button onClick={fetchCommissions} className="flex items-center text-slate-600 hover:text-blue-600 bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm transition-colors">
            <FiRefreshCw className="mr-2" /> Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Referrer (Pay To)</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Referred User</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(() => {
                const filteredCommissions = commissions.filter(comm => {
                  const term = searchTerm.toLowerCase();
                  return (
                    (comm.referrerName && comm.referrerName.toLowerCase().includes(term)) ||
                    (comm.referredName && comm.referredName.toLowerCase().includes(term)) ||
                    (comm.referrerPhone && comm.referrerPhone.includes(term))
                  );
                });

                if (filteredCommissions.length === 0) {
                  return <tr><td colSpan="7" className="text-center py-8 text-slate-500">No commissions found.</td></tr>;
                }
                
                return filteredCommissions.map((comm) => (
                <tr key={comm.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(comm.createdAt).toLocaleDateString()}<br/>
                    <span className="text-xs text-slate-400">{new Date(comm.createdAt).toLocaleTimeString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{comm.referrerName}</div>
                    {comm.referrerBankDetails ? (
                      <div className="mt-1.5 p-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-600 space-y-0.5 w-max">
                        <div className="text-slate-700 font-semibold">{comm.referrerBankDetails.bankName}</div>
                        <div className="font-mono">A/c: <span className="font-medium text-slate-800">{comm.referrerBankDetails.accountNumber}</span></div>
                        <div className="font-mono">IFSC: <span className="font-medium text-slate-800 uppercase">{comm.referrerBankDetails.ifscCode}</span></div>
                        <div>Name: {comm.referrerBankDetails.accountName}</div>
                      </div>
                    ) : (
                      <div className="mt-1.5 text-[11px] text-orange-500 bg-orange-50 px-2 py-1 rounded-md inline-block">
                        No bank details added
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">{comm.referrerPhone || '-'}</td>
                  <td className="px-6 py-4">{comm.referredName}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">₹{comm.commissionAmount}</div>
                    <div className="text-xs text-slate-400">{comm.commissionRate}% of ₹{comm.subscriptionAmount}</div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(comm.status)}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {comm.status === 'pending' && (
                      <button onClick={() => updateStatus(comm.id, 'approved')} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100">Approve</button>
                    )}
                    {(comm.status === 'pending' || comm.status === 'approved') && (
                      <button onClick={() => updateStatus(comm.id, 'paid')} className="text-xs px-2 py-1 bg-emerald-50 text-emerald-600 rounded border border-emerald-200 hover:bg-emerald-100">Mark Paid</button>
                    )}
                    {comm.status !== 'reversed' && comm.status !== 'paid' && (
                      <button onClick={() => updateStatus(comm.id, 'reversed')} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded border border-red-200 hover:bg-red-100">Reverse</button>
                    )}
                  </td>
                </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
