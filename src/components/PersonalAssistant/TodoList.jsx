import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/userContext';
import { db } from '../../firebase/firebase';
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { FiCheckCircle, FiCircle, FiTrash2, FiPlus, FiCalendar, FiX, FiClock, FiRepeat } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function TodoList() {
  const { user } = useUser();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  
  // Date Range State
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Tab State
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'completed'
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const q = query(
      collection(db, 'todos'),
      where('userId', '==', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      fetchedTasks = fetchedTasks.filter(task => {
        let valid = true;
        if (startDate) valid = valid && task.taskDate >= startDate;
        if (endDate) valid = valid && task.taskDate <= endDate;
        return valid;
      });
      
      fetchedTasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setTasks(fetchedTasks);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [startDate, endDate, user]);

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || !user) return;
    try {
      const taskDate = endDate || new Date().toISOString().split('T')[0]; // Assign to end date or today if cleared
      const newTaskObj = {
        userId: user.uid,
        title: newTask.trim(),
        taskDate: taskDate,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'todos'), newTaskObj);
      setTasks([...tasks, { id: docRef.id, ...newTaskObj }]);
      setNewTask('');
      toast.success('Task added');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    }
  };

  const getNextRecurrenceDate = (currentDateStr, recurrence) => {
    const date = new Date(currentDateStr || new Date().toISOString().split('T')[0]);
    if (recurrence === 'daily') date.setDate(date.getDate() + 1);
    else if (recurrence === 'weekly') date.setDate(date.getDate() + 7);
    else if (recurrence === 'monthly') date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  };

  const toggleTask = async (id, currentStatus) => {
    const task = tasks.find(t => t.id === id);
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    try {
      await updateDoc(doc(db, 'todos', id), { status: newStatus });
      
      // If completing a recurring task, clone it to the next recurrence date
      if (newStatus === 'completed' && task && task.recurrence && task.recurrence !== 'none') {
        const nextDate = getNextRecurrenceDate(task.taskDate, task.recurrence);
        const newTaskObj = {
          userId: user.uid,
          title: task.title,
          taskDate: nextDate,
          taskTime: task.taskTime || '',
          recurrence: task.recurrence,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        await addDoc(collection(db, 'todos'), newTaskObj);
        // Note: the onSnapshot listener will automatically pull in the new task
      }
      
      // Local optimistic update for the current task
      setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (id) => {
    try {
      await deleteDoc(doc(db, 'todos', id));
      setTasks(tasks.filter(t => t.id !== id));
      toast.success('Task deleted');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'pending') return task.status === 'pending';
    if (activeTab === 'completed') return task.status === 'completed';
    return true; // 'all'
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800">Date-wise To-Do</h2>
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-50 p-2 rounded-lg relative">
          <div className="flex items-center gap-2 px-2 text-sm font-medium text-gray-700">
            <FiCalendar className="text-purple-500" />
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent outline-none border-none cursor-pointer max-w-[120px]"
            />
          </div>
          <span className="text-gray-400">to</span>
          <div className="flex items-center gap-2 px-2 text-sm font-medium text-gray-700">
            <FiCalendar className="text-purple-500" />
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent outline-none border-none cursor-pointer max-w-[120px]"
            />
          </div>
          {(startDate || endDate) && (
            <button 
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="ml-1 p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors focus:outline-none flex items-center justify-center"
              title="Clear Dates"
            >
              <FiX size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-2 px-4 text-sm font-medium transition-colors relative ${activeTab === 'all' ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          All
          {activeTab === 'all' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-t-md"></span>}
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-2 px-4 text-sm font-medium transition-colors relative ${activeTab === 'pending' ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Pending
          {activeTab === 'pending' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-t-md"></span>}
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-2 px-4 text-sm font-medium transition-colors relative ${activeTab === 'completed' ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Completed
          {activeTab === 'completed' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-t-md"></span>}
        </button>
      </div>

      <form onSubmit={addTask} className="flex gap-2 mb-6">
        <input 
          type="text" 
          value={newTask} 
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1 rounded-lg border text-gray-900 border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20"
        />
        <button type="submit" disabled={!newTask.trim()} className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white p-2.5 rounded-lg transition-colors flex items-center justify-center">
          <FiPlus size={20} />
        </button>
      </form>

      <div className="flex-1 overflow-y-auto pr-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-10 text-gray-400 flex flex-col items-center">
            <FiCheckCircle size={40} className="mb-3 text-gray-300" />
            <p>No tasks found for this period.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredTasks.map(task => (
              <li key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-purple-200 bg-gray-50 hover:bg-purple-50/30 transition-all group">
                <button onClick={() => toggleTask(task.id, task.status)} className="text-purple-500 focus:outline-none flex-shrink-0">
                  {task.status === 'completed' ? <FiCheckCircle size={20} className="text-green-500" /> : <FiCircle size={20} />}
                </button>
                <span className={`flex-1 text-sm ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {task.title}
                </span>
                {task.taskTime && (
                  <span className="flex items-center gap-1 text-xs text-blue-500 font-medium px-2 flex-shrink-0 bg-blue-50 rounded-md py-0.5">
                    <FiClock size={12} /> {task.taskTime}
                  </span>
                )}
                {task.recurrence && task.recurrence !== 'none' && (
                  <span className="flex items-center gap-1 text-xs text-purple-500 font-medium px-2 flex-shrink-0" title={`Repeats ${task.recurrence}`}>
                    <FiRepeat size={12} />
                  </span>
                )}
                {task.taskDate && (
                  <span className="text-xs text-gray-400 font-medium px-2 flex-shrink-0">
                    {new Date(task.taskDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                )}
                <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none flex-shrink-0">
                  <FiTrash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
