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
  const [pendingTasks, setPendingTasks] = useState([]);
  const [dismissed, setDismissed] = useState(false);
  const notificationFiredRef = useRef(false);
  const notifiedTasksRef = useRef(new Set());

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
        const allPending = allTodos.filter(
          t => t.status === 'pending'
        );

        setPendingTasks(allPending);

        // Fire browser notification only ONCE per session (first time we see pending tasks)
        if (
          allPending.length > 0 &&
          !notificationFiredRef.current &&
          !sessionStorage.getItem(sessionKey)
        ) {
          notificationFiredRef.current = true;
          sessionStorage.setItem(sessionKey, '1');

          if (typeof window !== 'undefined' && 'Notification' in window) {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                const taskNames = allPending.map(t => `• ${t.title}`).join('\n');
                new Notification('📋 Pending Tasks Reminder', {
                  body:
                    allPending.length === 1
                      ? `You have a pending task:\n${taskNames}`
                      : `You have ${allPending.length} pending tasks:\n${taskNames}`,
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

    // Exact time notification interval checker
    const intervalId = setInterval(() => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      
      setPendingTasks(currentTasks => {
        const now = new Date();
        const currentHHMM = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        const currentDate = now.toISOString().split('T')[0];
        
        currentTasks.forEach(task => {
          if (task.taskDate === currentDate && task.taskTime === currentHHMM) {
            const notifyKey = `${task.id}_${currentDate}_${currentHHMM}`;
            if (!notifiedTasksRef.current.has(notifyKey)) {
              notifiedTasksRef.current.add(notifyKey);
              
              const fireNotification = () => {
                new Notification(`⏰ Reminder: ${task.title}`, {
                  body: `Scheduled for ${task.taskTime}`,
                  icon: '/icons/icon-192x192.png',
                  tag: notifyKey
                });
              };

              if (Notification.permission === 'granted') {
                fireNotification();
              } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                  if (permission === 'granted') fireNotification();
                });
              }
            }
          }
        });
        return currentTasks;
      });
    }, 30000); // Check every 30 seconds

    // Cleanup listener when component unmounts or user changes
    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [user]);

  const dismiss = () => setDismissed(true);

  return {
    // Return empty when manually dismissed; otherwise always reflects live Firestore state
    pendingTasks: dismissed ? [] : pendingTasks,
    hasPendingReminder: !dismissed && pendingTasks.length > 0,
    dismiss,
  };
}
