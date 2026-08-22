'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../../../context/userContext';
import { useTaskReminder } from '../../../../hooks/useTaskReminder';
import { Bell, CheckCircle, Clock, ArrowRight } from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { pendingTasks, dismiss } = useTaskReminder(user);

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your pending tasks and alerts</p>
        </div>
        {pendingTasks.length > 0 && (
          <button 
            onClick={dismiss} 
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-4 py-2.5 rounded-xl transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {pendingTasks.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {pendingTasks.map(task => {
              const taskDate = task.createdAt?.toDate ? task.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (task.date || '');
              return (
                <div key={task.id} className="p-5 sm:p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="mt-1 bg-amber-50 p-2.5 rounded-full text-amber-500 flex-shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{task.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">Pending Task</p>
                      {task.description && (
                        <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 mt-2 sm:mt-0 ml-14 sm:ml-0">
                    {taskDate && <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">{taskDate}</span>}
                    <button 
                      onClick={() => router.push('/personal-assistant')} 
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1.5 group"
                    >
                      Go to Tasks
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center px-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 text-slate-300 mb-5 border border-slate-100">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">All caught up!</h3>
            <p className="text-slate-500 max-w-md mx-auto">You have no pending tasks or notifications at the moment. Relax and enjoy your day.</p>
          </div>
        )}
      </div>
    </div>
  );
}
