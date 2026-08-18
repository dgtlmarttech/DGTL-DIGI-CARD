import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

/**
 * useTaskReminder
 *
 * Watches today's pending tasks in real-time via a Firestore onSnapshot listener.
 * - Automatically removes tasks from the banner as they are completed (no refresh needed)
 * - Hides the banner entirely when all today's tasks are completed
 * - Fires a browser push notification once per session (sessionStorage guard)
 * - Cleans up the Firestore listener on unmount
 */
export function useTaskReminder(user) {
  const [pendingTodayTasks, setPendingTodayTasks] = useState([]);
  const [dismissed, setDismissed] = useState(false);
  const notificationFiredRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const sessionKey = `pa_reminder_${user.uid}_${today}`;

    // Real-time Firestore listener — fires immediately and on every change
    const q = query(
      collection(db, 'todos'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allTodos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Re-filter every time — completed tasks are excluded automatically
        const todayPending = allTodos.filter(
          t => t.taskDate === today && t.status === 'pending'
        );

        setPendingTodayTasks(todayPending);

        // Fire browser notification only ONCE per session (first time we see pending tasks)
        if (
          todayPending.length > 0 &&
          !notificationFiredRef.current &&
          !sessionStorage.getItem(sessionKey)
        ) {
          notificationFiredRef.current = true;
          sessionStorage.setItem(sessionKey, '1');

          if (typeof window !== 'undefined' && 'Notification' in window) {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                const taskNames = todayPending.map(t => `• ${t.title}`).join('\n');
                new Notification('📋 Pending Tasks Reminder', {
                  body:
                    todayPending.length === 1
                      ? `You still have a pending task today:\n${taskNames}`
                      : `You have ${todayPending.length} pending tasks today:\n${taskNames}`,
                  icon: '/icons/icon-192x192.png',
                  tag: `reminder-${user.uid}-${today}`, // Deduplicate notifications
                });
              }
            });
          }
        }
      },
      (err) => {
        console.error('[useTaskReminder] Snapshot error:', err);
      }
    );

    // Cleanup listener when component unmounts or user changes
    return () => unsubscribe();
  }, [user]);

  const dismiss = () => setDismissed(true);

  return {
    // Return empty when manually dismissed; otherwise always reflects live Firestore state
    pendingTodayTasks: dismissed ? [] : pendingTodayTasks,
    hasPendingReminder: !dismissed && pendingTodayTasks.length > 0,
    dismiss,
  };
}
