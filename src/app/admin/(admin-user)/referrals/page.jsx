'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../../../../firebase/firebase';
import { collection, getDocs, getDoc, query, orderBy, updateDoc, doc, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { FiUsers, FiLink, FiPercent, FiSettings, FiCheck, FiX, FiSearch, FiRefreshCw } from 'react-icons/fi';

export default function AdminReferralsPage() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      // Fetch only qualified referrals (meaning referred user bought a plan)
      const q = query(collection(db, 'referrals'), where('status', '==', 'qualified'));
      const snap = await getDocs(q);
      
      const codesData = [];
      for (const d of snap.docs) {
        const data = d.data();
        
        // Fetch Referrer Name
        let referrerName = 'Unknown';
        if (data.referrerUserId) {
          const referrerSnap = await getDoc(doc(db, 'users', data.referrerUserId));
          if (referrerSnap.exists()) {
            const u = referrerSnap.data();
            referrerName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
          } else {
            // Fallback for older documents without proper ID structure
            const referrerQ = query(collection(db, 'users'), where('uid', '==', data.referrerUserId));
            const referrerQS = await getDocs(referrerQ);
            if (!referrerQS.empty) {
              const u = referrerQS.docs[0].data();
              referrerName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
            } else {
              // Check if referrer is an Affiliate
              const affSnap = await getDoc(doc(db, 'affiliates', data.referrerUserId));
              if (affSnap.exists()) {
                const a = affSnap.data();
                referrerName = a.full_name || a.email || 'Affiliate';
              }
            }
          }
        }

        // Fetch Referred User Name
        let referredName = 'Unknown';
        if (data.referredUserId) {
          const referredSnap = await getDoc(doc(db, 'users', data.referredUserId));
          if (referredSnap.exists()) {
            const u = referredSnap.data();
            referredName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
          } else {
            const referredQ = query(collection(db, 'users'), where('uid', '==', data.referredUserId));
            const referredQS = await getDocs(referredQ);
            if (!referredQS.empty) {
              const u = referredQS.docs[0].data();
              referredName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
            }
          }
        }

        // Fetch the Referrer's code status to allow disabling them
        let codeId = null;
        let codeStatus = 'active';
        const codeQ = query(collection(db, 'referralCodes'), where('code', '==', data.referralCode));
        const codeSnap = await getDocs(codeQ);
        if (!codeSnap.empty) {
          codeId = codeSnap.docs[0].id;
          codeStatus = codeSnap.docs[0].data().status;
        }
        
        codesData.push({
          id: d.id,
          ...data,
          referrerName,
          referredName,
          codeId,
          codeStatus
        });
      }
      
      // Sort desc by date
      codesData.sort((a, b) => new Date(b.qualifiedAt || b.createdAt) - new Date(a.qualifiedAt || a.createdAt));
      setCodes(codesData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  const toggleCodeStatus = async (codeId, currentStatus) => {
    if (!codeId) return toast.error('Code ID not found');
    try {
      const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
      await updateDoc(doc(db, 'referralCodes', codeId), {
        status: newStatus
      });
      // Update local state to reflect the Referrer's new code status
      setCodes(codes.map(c => c.codeId === codeId ? { ...c, codeStatus: newStatus } : c));
      toast.success(`Referrer's Code ${newStatus}`);
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
          <h1 className="text-2xl font-bold text-slate-800">Successful Referrals</h1>
          <p className="text-slate-500">View users who successfully referred others to paid plans.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search name or code..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 w-64"
            />
          </div>
          <button onClick={fetchCodes} className="flex items-center text-slate-600 hover:text-blue-600 bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm transition-colors">
            <FiRefreshCw className="mr-2" /> Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Referrer</th>
                <th className="px-6 py-4">Referred User</th>
                <th className="px-6 py-4">Code Used</th>
                <th className="px-6 py-4">Date Qualified</th>
                <th className="px-6 py-4">Referral Status</th>
                <th className="px-6 py-4 text-right">Referrer Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(() => {
                const filteredCodes = codes.filter(ref => {
                  const term = searchTerm.toLowerCase();
                  return (
                    (ref.referrerName && ref.referrerName.toLowerCase().includes(term)) ||
                    (ref.referredName && ref.referredName.toLowerCase().includes(term)) ||
                    (ref.referralCode && ref.referralCode.toLowerCase().includes(term))
                  );
                });

                if (filteredCodes.length === 0) {
                  return <tr><td colSpan="6" className="text-center py-8 text-slate-500">No successful referrals found.</td></tr>;
                }

                return filteredCodes.map((ref) => (
                <tr key={ref.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-800">{ref.referrerName}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{ref.referredName}</td>
                  <td className="px-6 py-4 font-mono font-medium text-blue-600">{ref.referralCode}</td>
                  <td className="px-6 py-4">{new Date(ref.qualifiedAt || ref.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      Qualified
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {ref.codeId ? (
                      <button 
                        onClick={() => toggleCodeStatus(ref.codeId, ref.codeStatus)}
                        className={`text-xs px-3 py-1 rounded-md border ${
                          ref.codeStatus === 'active' 
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {ref.codeStatus === 'active' ? 'Disable Referrer' : 'Enable Referrer'}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
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
