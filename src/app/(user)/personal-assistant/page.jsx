'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../../context/userContext';
import { FiArrowLeft, FiCheckSquare, FiFileText, FiHeadphones, FiBell, FiX } from 'react-icons/fi';
import TodoList from '../../../components/PersonalAssistant/TodoList';
import MeetingNotes from '../../../components/PersonalAssistant/MeetingNotes';
import VoiceNotes from '../../../components/PersonalAssistant/VoiceNotes';
import VapiAssistant from '../../../components/PersonalAssistant/VapiAssistant';
import { useTaskReminder } from '../../../hooks/useTaskReminder';

export default function PersonalAssistantDashboard() {
  const router = useRouter();
  const { user, userInfo, loading: userLoading, isAuthenticated } = useUser();
  const [activeTab, setActiveTab] = useState('todo'); // todo, meetings, voice

  // Reminder hook — fires browser notification + returns pending tasks for banner
  const { pendingTodayTasks, hasPendingReminder, dismiss } = useTaskReminder(user);

  useEffect(() => {
    if (!userLoading) {
      if (!isAuthenticated) {
        router.push('/signin');
        return;
      }
      
      // Access Control Verification
      if (!userInfo?.effectiveIsPA) {
        router.push('/payment');
      }
    }
  }, [isAuthenticated, userLoading, userInfo, router]);

  if (userLoading || !userInfo?.effectiveIsPA) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
              onClick={() => router.back()}
            >
              <FiArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                Personal Assistant
              </h1>
              <p className="text-gray-500 text-sm">
                {getGreeting()} 👋 {userInfo?.firstName || 'User'}
              </p>
            </div>
          </div>
        </header>

        {/* ── Pending Task Reminder Banner ── */}
        {hasPendingReminder && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2 duration-300">
            <div className="flex-shrink-0 mt-0.5">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600">
                <FiBell size={16} />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">
                🔔 You have {pendingTodayTasks.length} pending task{pendingTodayTasks.length > 1 ? 's' : ''} for today
              </p>
              <ul className="mt-1.5 space-y-1">
                {pendingTodayTasks.map(task => (
                  <li key={task.id} className="text-sm text-amber-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                    {task.title}
                  </li>
                ))}
              </ul>

            </div>
            <button
              onClick={dismiss}
              className="flex-shrink-0 text-amber-400 hover:text-amber-600 transition-colors p-1 rounded"
              aria-label="Dismiss reminder"
            >
              <FiX size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-160px)] min-h-[600px]">
          {/* Main Content Area (2/3 width on desktop) */}
          <div className="lg:col-span-2 flex flex-col h-full">
            {/* Tabs */}
            <div className="flex bg-white rounded-xl shadow-sm p-1 mb-6 border border-gray-100">
              <button
                onClick={() => setActiveTab('todo')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'todo' ? 'bg-purple-50 text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FiCheckSquare /> To-Do List
              </button>
              <button
                onClick={() => setActiveTab('meetings')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'meetings' ? 'bg-purple-50 text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FiFileText /> Meeting Notes
              </button>
              <button
                onClick={() => setActiveTab('voice')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'voice' ? 'bg-purple-50 text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FiHeadphones /> Voice Notes
              </button>
            </div>

            {/* Active Component */}
            <div className="flex-1 min-h-0">
              {activeTab === 'todo' && <TodoList />}
              {activeTab === 'meetings' && <MeetingNotes />}
              {activeTab === 'voice' && <VoiceNotes />}
            </div>
          </div>

          {/* Right Sidebar (1/3 width on desktop) */}
          <div className="flex flex-col gap-6 h-full">
            <div className="flex-1 min-h-[300px]">
              <VapiAssistant />
            </div>
            
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Plan valid until</span>
                  <span className="text-sm font-semibold text-gray-700">
                    {(() => {
                      const expiry = userInfo?.paExpireDate || userInfo?.planEndDate || userInfo?.expireDate || userInfo?.premiumEndDate;
                      return expiry ? new Date(expiry.toDate?.() || expiry).toLocaleDateString() : 'N/A';
                    })()}
                  </span>
                </div>
                {pendingTodayTasks.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Pending today</span>
                    <span className="text-sm font-semibold text-amber-600">
                      {pendingTodayTasks.length} task{pendingTodayTasks.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
