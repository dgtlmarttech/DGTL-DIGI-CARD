import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/userContext';
import { db } from '../../firebase/firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { FiCheckCircle, FiCircle, FiTrash2, FiPlus, FiCalendar } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function TodoList() {
  const { user } = useUser();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async (date) => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'todos'),
        where('userId', '==', user.uid),
        where('taskDate', '==', date)
      );
      const querySnapshot = await getDocs(q);
      const fetchedTasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in JS instead of compound index to avoid requiring index creation
      fetchedTasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(selectedDate);
  }, [selectedDate, user]);

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || !user) return;
    try {
      const docRef = await addDoc(collection(db, 'todos'), {
        userId: user.uid,
        title: newTask.trim(),
        taskDate: selectedDate,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setTasks([...tasks, { id: docRef.id, title: newTask.trim(), status: 'pending', taskDate: selectedDate }]);
      setNewTask('');
      toast.success('Task added');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    }
  };

  const toggleTask = async (id, currentStatus) => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    try {
      await updateDoc(doc(db, 'todos', id), { status: newStatus });
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

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Date-wise To-Do</h2>
        <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-lg">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-200 rounded-md transition-colors">&lt;</button>
          <div className="flex items-center gap-2 px-2 text-sm font-medium text-gray-700">
            <FiCalendar className="text-purple-500" />
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent outline-none border-none cursor-pointer"
            />
          </div>
          <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-200 rounded-md transition-colors">&gt;</button>
        </div>
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
        ) : tasks.length === 0 ? (
          <div className="text-center py-10 text-gray-400 flex flex-col items-center">
            <FiCheckCircle size={40} className="mb-3 text-gray-300" />
            <p>No tasks for this date.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {tasks.map(task => (
              <li key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-purple-200 bg-gray-50 hover:bg-purple-50/30 transition-all group">
                <button onClick={() => toggleTask(task.id, task.status)} className="text-purple-500 focus:outline-none flex-shrink-0">
                  {task.status === 'completed' ? <FiCheckCircle size={20} className="text-green-500" /> : <FiCircle size={20} />}
                </button>
                <span className={`flex-1 text-sm ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {task.title}
                </span>
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
