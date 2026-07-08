'use client'
import React, { useState, useEffect } from 'react';
import { getAllDeletionRequests } from '../../../../services/firebaseAuthService';
import { 
  Trash2, 
  Search, 
  RefreshCw,
  Mail,
  Calendar,
  AlertCircle
} from 'lucide-react';

const DeletionRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await getAllDeletionRequests();
      // Sort by date descending (newest first)
      const sorted = data.sort((a, b) => {
        const dateA = a.requestedAt?.toDate ? a.requestedAt.toDate().getTime() : 0;
        const dateB = b.requestedAt?.toDate ? b.requestedAt.toDate().getTime() : 0;
        return dateB - dateA;
      });
      setRequests(sorted);
    } catch (error) {
      console.error('Error fetching deletion requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter((req) => {
    return req.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <RefreshCw className="w-8 h-8 text-red-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Requests</h2>
          <p className="text-gray-600">Fetching account deletion requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account Deletions</h1>
              <p className="text-gray-600">Manage user account deletion requests</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchRequests}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 active:scale-95 transform"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 flex justify-between items-center">
        <div className="text-lg font-medium text-gray-700">
          Total Requests: <span className="font-bold text-red-600">{filteredRequests.length}</span>
        </div>
        
        {/* Search Box */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border text-gray-900 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      {/* Request List */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {filteredRequests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white border-2 border-red-100 rounded-xl p-6 hover:shadow-lg hover:shadow-red-50 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-bl-lg">
                  {req.status || 'Pending'}
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-1 min-w-0 pt-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      {req.email}
                    </h3>
                    
                    <div className="space-y-3 mt-4">
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <span className="font-medium text-gray-900 block mb-1">Reason provided:</span>
                        {req.reason || <span className="text-gray-400 italic">No reason provided</span>}
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>Requested: {formatDate(req.requestedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No requests found
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? `No requests match the email "${searchTerm}"` 
                : `There are currently no account deletion requests.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeletionRequests;
