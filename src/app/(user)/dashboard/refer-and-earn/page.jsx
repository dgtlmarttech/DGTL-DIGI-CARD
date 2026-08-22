'use client';
import React, { useState, useEffect } from 'react';
import { useUser } from '../../../../context/userContext';
import { getUserReferralStats } from '../../../../services/referralService';
import { toast } from 'react-toastify';
import { FiCopy, FiShare2, FiDollarSign, FiUsers, FiAward, FiLink } from 'react-icons/fi';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebase/firebase';

const ReferAndEarnPage = () => {
  const { user, userInfo } = useUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      if (user?.uid) {
        setLoading(true);
        const data = await getUserReferralStats(user.uid);
        setStats(data);
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (user?.uid) {
        setHistoryLoading(true);
        try {
          const q = query(
            collection(db, 'referrals'),
            where('referrerUserId', '==', user.uid)
          );
          const snap = await getDocs(q);
          const historyData = [];

          for (const document of snap.docs) {
            const refData = document.data();

            // Fetch if commission exists
            const commQ = query(collection(db, 'commissions'), where('referralId', '==', refData.id));
            const commSnap = await getDocs(commQ);

            let commissionData = null;
            if (!commSnap.empty) {
              commissionData = commSnap.docs[0].data();
            }

            // Get referred user partial info safely
            const userQ = query(collection(db, 'users'), where('uid', '==', refData.referredUserId));
            const userSnap = await getDocs(userQ);
            const refUser = userSnap.empty ? null : userSnap.docs[0].data();

            historyData.push({
              ...refData,
              commission: commissionData,
              userName: refUser ? `${refUser.firstName || ''} ${refUser.lastName || ''}`.trim() : 'Unknown User',
            });
          }

          // Sort by date desc manually since we don't have composite index yet
          historyData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setHistory(historyData);
        } catch (err) {
          console.error(err);
        } finally {
          setHistoryLoading(false);
        }
      }
    };
    fetchHistory();
  }, [user]);

  const copyToClipboard = () => {
    if (stats?.code) {
      const link = `${window.location.origin}/signup?ref=${stats.code}`;
      navigator.clipboard.writeText(link);
      toast.success('Referral link copied to clipboard!');
    }
  };

  const shareLink = async () => {
    if (stats?.code) {
      const link = `${window.location.origin}/signup?ref=${stats.code}`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Join DigiCard!',
            text: 'Create your digital business card and get premium features.',
            url: link
          });
        } catch (err) {
          console.log('Error sharing', err);
        }
      } else {
        copyToClipboard();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Refer & Earn</h1>
          <p className="text-slate-500 mt-1">Invite friends and earn 50% commission when they upgrade.</p>
        </div>
      </div>

      {/* Main Referral Card */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 md:p-10 text-white shadow-2xl relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 rounded-full bg-blue-400 opacity-20 blur-2xl"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1 w-full">
            <h2 className="text-3xl font-extrabold mb-4 tracking-tight">Share your link, get paid!</h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl leading-relaxed">
              For every friend who joins DigiCard and upgrades to a Monthly or Yearly plan using your referral link, you'll receive a <strong className="text-white bg-white/20 px-2 py-0.5 rounded">50% commission</strong> straight to your bank account.
            </p>

            <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner w-full">
              <p className="text-xs text-blue-200 font-bold mb-3 uppercase tracking-widest flex items-center gap-2">
                <FiLink /> Your Unique Referral Link
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                <div className="flex-1 bg-black/25 px-4 py-3 rounded-xl border border-black/10 overflow-x-auto min-w-0">
                  <code className="text-base font-mono whitespace-nowrap text-blue-50 block">
                    {window.location.origin}/signup?ref={stats?.code || 'LOADING'}
                  </code>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-white text-indigo-700 px-6 py-3 rounded-xl hover:bg-blue-50 hover:shadow-lg transition-all font-semibold active:scale-95"
                    title="Copy Link"
                  >
                    <FiCopy size={18} /> Copy
                  </button>
                  <button
                    onClick={shareLink}
                    className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-indigo-500/50 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl transition-all border border-indigo-400/30 hover:border-indigo-400 font-semibold active:scale-95"
                    title="Share"
                  >
                    <FiShare2 size={18} /> Share
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-center justify-center shrink-0 w-64">
            {/* Visual illustration */}
            <div className="relative w-48 h-48 flex items-center justify-center group">
              <div className="absolute inset-0 bg-white/5 rounded-full animate-pulse group-hover:scale-110 transition-transform duration-500"></div>
              <div className="absolute inset-4 bg-gradient-to-tr from-white/10 to-transparent rounded-full shadow-[inset_0_4px_20px_rgba(255,255,255,0.1)]"></div>
              <div className="absolute inset-0 flex items-center justify-center transform group-hover:-translate-y-2 transition-transform duration-500">
                <FiDollarSign size={80} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
            <FiUsers size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Referrals</p>
            <h3 className="text-3xl font-bold text-slate-800">{stats?.totalReferrals || 0}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="bg-orange-100 p-3 rounded-lg text-orange-600">
            <FiAward size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Pending Commission</p>
            <h3 className="text-3xl font-bold text-slate-800">₹{stats?.pendingCommission || 0}</h3>
            <p className="text-xs text-slate-400 mt-1">Pending admin payout</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm flex items-start gap-4">
          <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
            <FiDollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Earnings</p>
            <h3 className="text-3xl font-bold text-slate-800">₹{stats?.paidCommission || 0}</h3>
            <p className="text-xs text-slate-400 mt-1">Successfully paid out</p>
          </div>
        </div>
      </div>

      {/* Referral History */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Referral History</h2>
        </div>

        {historyLoading ? (
          <div className="p-8 text-center text-slate-500">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center">
            <div className="bg-slate-50 inline-flex p-4 rounded-full mb-4">
              <FiUsers size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-700">No referrals yet</h3>
            <p className="text-slate-500 mt-1">Share your link to start earning!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Commission</th>
                  <th className="px-6 py-4">Payout Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {item.userName}
                      <div className="text-xs font-normal text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'qualified' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          Qualified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          Registered
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.commission ? (
                        <span className="capitalize">{item.commission.planType}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.commission ? (
                        <span className="font-semibold text-slate-800">₹{item.commission.commissionAmount}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.commission ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.commission.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                            item.commission.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                              'bg-orange-100 text-orange-800'
                          }`}>
                          {item.commission.status.charAt(0).toUpperCase() + item.commission.status.slice(1)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferAndEarnPage;
