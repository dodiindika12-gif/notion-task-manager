"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';

// Default Data when localStorage/DB is empty
const SEED_PROJECTS = [
    { id: 'p1', name: 'Personal', isPinned: false, color: '#2563eb' },
    { id: 'p2', name: 'Work', isPinned: true, color: '#16a34a' }
];

const DEFAULT_PROJECT_COLORS = ['#2563eb', '#16a34a', '#db2777', '#ea580c', '#7c3aed', '#0f766e', '#dc2626', '#4f46e5', '#0891b2'];

const SEED_MEMBERS = [
    { id: 'm1', name: 'Dodi', position: 'SPV Markom', color: '#ef4444' },
    { id: 'm2', name: 'Heru', position: 'CSR', color: '#f97316' },
    { id: 'm3', name: 'Hardyan', position: 'Content', color: '#eab308' },
    { id: 'm4', name: 'Ary', position: 'DM', color: '#22c55e' },
    { id: 'm5', name: 'Ona', position: 'Design', color: '#14b8a6' },
];

const SEED_TASKS = [
    { id: '1', projectId: 'p2', title: 'Evaluasi strategi marketing Beauty Kendari Q3', status: 'In Progress', priority: 'High', deadline: '2026-07-05', picId: 'm1' },
    { id: '2', projectId: 'p1', title: 'Setup workflow n8n di server CasaOS', status: 'To Do', priority: 'Medium', deadline: '2026-07-02', picId: 'm3' },
    { id: '3', projectId: 'p1', title: 'Siapkan perlengkapan harian untuk Kia', status: 'To Do', priority: 'High', deadline: '', picId: '' },
    { id: '4', projectId: 'p2', title: 'Draft materi presentasi CV Mitra Makmur Mandiri', status: 'Done', priority: 'Low', deadline: '2026-06-25', picId: 'm5' }
];

const SEED_SHORTCUTS = [
    { id: 's1', title: 'Portal BA', url: 'https://portalba.abskdi.biz.id/', icon: 'BA', color: '#2563eb', isFavorite: true },
    { id: 's2', title: 'Portal Promo', url: 'https://promo.abskdi.biz.id/', icon: 'PR', color: '#db2777', isFavorite: true },
    { id: 's3', title: 'Meta Ads', url: 'https://adsmanager.facebook.com/', icon: 'MA', color: '#0ea5e9', isFavorite: true },
    { id: 's4', title: 'Instagram', url: 'https://www.instagram.com/beauty.kendari/', icon: 'IG', color: '#e11d48', isFavorite: true },
    { id: 's5', title: 'TikTok', url: 'https://www.tiktok.com/', icon: 'TT', color: '#111827', isFavorite: true },
    { id: 's6', title: 'Google Drive', url: 'https://drive.google.com/', icon: 'DR', color: '#16a34a', isFavorite: true },
    { id: 's7', title: 'Google Sheets', url: 'https://docs.google.com/spreadsheets/', icon: 'SH', color: '#15803d', isFavorite: false },
    { id: 's8', title: 'Canva', url: 'https://www.canva.com/', icon: 'CV', color: '#7c3aed', isFavorite: false },
    { id: 's9', title: 'Shopee', url: 'https://seller.shopee.co.id/', icon: 'SP', color: '#ea580c', isFavorite: false }
];

const SEED_NOTES = [];

const PRIORITIES = {
    'High': { color: 'text-pink-700 bg-pink-100', icon: 'fa-angles-up' },
    'Medium': { color: 'text-orange-700 bg-orange-100', icon: 'fa-angle-up' },
    'Low': { color: 'text-sky-700 bg-sky-100', icon: 'fa-angle-down' }
};

const COLUMNS = ['To Do', 'In Progress', 'Done'];
const ALL_MARKOM_LABEL = 'All Tim Markom';

const COLUMN_TINTS = {
    'To Do': { chip: 'tint-sky', header: 'bg-sky-50/70', drop: 'bg-sky-50/40 border-sky-100' },
    'In Progress': { chip: 'tint-lavender', header: 'bg-violet-50/70', drop: 'bg-violet-50/40 border-violet-100' },
    'Done': { chip: 'tint-mint', header: 'bg-emerald-50/70', drop: 'bg-emerald-50/40 border-emerald-100' }
};

const getGreeting = (date = new Date()) => {
    const hour = date.getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
};

const ProgressRing = ({ percent = 0, size = 32, stroke = 4, color = '#7c3aed', trackColor = '#ede9fe' }) => {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const clamped = Math.max(0, Math.min(100, percent));
    const offset = circumference - (clamped / 100) * circumference;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={stroke} />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
            />
        </svg>
    );
};

const KENDARI_LAT = -3.9450;
const KENDARI_LON = 122.4989;

const WEATHER_CODE_MAP = {
    0: { label: 'Cerah', icon: 'fa-sun' },
    1: { label: 'Cerah Berawan', icon: 'fa-cloud-sun' },
    2: { label: 'Berawan Sebagian', icon: 'fa-cloud-sun' },
    3: { label: 'Berawan', icon: 'fa-cloud' },
    45: { label: 'Berkabut', icon: 'fa-smog' },
    48: { label: 'Berkabut', icon: 'fa-smog' },
    51: { label: 'Gerimis Ringan', icon: 'fa-cloud-rain' },
    53: { label: 'Gerimis', icon: 'fa-cloud-rain' },
    55: { label: 'Gerimis Lebat', icon: 'fa-cloud-rain' },
    61: { label: 'Hujan Ringan', icon: 'fa-cloud-showers-heavy' },
    63: { label: 'Hujan', icon: 'fa-cloud-showers-heavy' },
    65: { label: 'Hujan Lebat', icon: 'fa-cloud-showers-heavy' },
    80: { label: 'Hujan Lokal', icon: 'fa-cloud-showers-heavy' },
    81: { label: 'Hujan Lokal Lebat', icon: 'fa-cloud-showers-heavy' },
    82: { label: 'Hujan Sangat Lebat', icon: 'fa-cloud-showers-heavy' },
    95: { label: 'Badai Petir', icon: 'fa-bolt' },
    96: { label: 'Badai Petir', icon: 'fa-bolt' },
    99: { label: 'Badai Petir', icon: 'fa-bolt' }
};

const getWeatherInfo = (code) => WEATHER_CODE_MAP[code] || { label: 'Tidak diketahui', icon: 'fa-cloud' };

const WeatherWidget = () => {
    const [state, setState] = useState({ status: 'loading', current: null, tempMax: null, tempMin: null });

    useEffect(() => {
        let cancelled = false;

        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${KENDARI_LAT}&longitude=${KENDARI_LON}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FMakassar`)
            .then(res => res.json())
            .then(data => {
                if (cancelled) return;
                if (!data?.current) {
                    setState({ status: 'error', current: null, tempMax: null, tempMin: null });
                    return;
                }
                setState({
                    status: 'ready',
                    current: data.current,
                    tempMax: data.daily?.temperature_2m_max?.[0] ?? null,
                    tempMin: data.daily?.temperature_2m_min?.[0] ?? null
                });
            })
            .catch(() => {
                if (!cancelled) setState({ status: 'error', current: null, tempMax: null, tempMin: null });
            });

        return () => { cancelled = true; };
    }, []);

    if (state.status === 'loading') {
        return (
            <div className="flex items-center gap-2 text-white/70 text-sm px-4 py-2.5">
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Memuat cuaca...</span>
            </div>
        );
    }

    if (state.status === 'error') {
        return (
            <div className="flex items-center gap-2 text-white/70 text-sm px-4 py-2.5">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>Cuaca tidak tersedia</span>
            </div>
        );
    }

    const info = getWeatherInfo(state.current.weather_code);
    const temp = Math.round(state.current.temperature_2m);

    return (
        <div className="flex items-center gap-3 bg-white/15 rounded-2xl px-4 py-2.5">
            <i className={`fa-solid ${info.icon} text-3xl`}></i>
            <div>
                <div className="text-xs text-white/70">Kendari</div>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold leading-none">{temp}°C</span>
                    <span className="text-xs text-white/80">{info.label}</span>
                </div>
                {(state.tempMax !== null && state.tempMin !== null) && (
                    <div className="text-[10px] text-white/60 mt-0.5">H: {Math.round(state.tempMax)}° L: {Math.round(state.tempMin)}°</div>
                )}
            </div>
        </div>
    );
};

const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const getTodoProgress = (task) => {
    const todos = Array.isArray(task.todos) ? task.todos : [];
    return {
        total: todos.length,
        done: todos.filter(todo => todo.done).length
    };
};

const getDefaultProjectColor = (index = 0) => DEFAULT_PROJECT_COLORS[index % DEFAULT_PROJECT_COLORS.length];

const isDefaultCalendarProject = (name = '') => ['promo', 'event'].includes(name.trim().toLowerCase());

const hexToRgba = (hex, alpha = 1) => {
    const cleanHex = (hex || '#2563eb').replace('#', '');
    if (cleanHex.length !== 6) return `rgba(37, 99, 235, ${alpha})`;
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getDateOnly = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date;
};

const getDeadlineState = (deadline, status) => {
    if (!deadline || status === 'Done') return 'normal';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = getDateOnly(deadline);
    if (!dueDate) return 'normal';
    if (dueDate < today) return 'overdue';
    if (dueDate.getTime() === today.getTime()) return 'today';
    return 'normal';
};

const formatDeadline = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const toDateInputValue = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const addDays = (date, days) => {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    nextDate.setHours(0, 0, 0, 0);
    return nextDate;
};

const getWeekEnd = (date) => {
    const weekEnd = new Date(date);
    const daysUntilSunday = 7 - weekEnd.getDay();
    weekEnd.setDate(weekEnd.getDate() + (daysUntilSunday === 7 ? 0 : daysUntilSunday));
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
};

const TaskEditModal = ({ task, projects, members, isOpen, onClose, onSave }) => {
    const [editedTask, setEditedTask] = useState(task || {});
    const [todoDraft, setTodoDraft] = useState('');

    useEffect(() => {
        if (task) {
            setEditedTask({
                ...task,
                todos: Array.isArray(task.todos)
                    ? task.todos.map(todo => ({ ...todo, picId: todo.picId || todo.pic_id || '' }))
                    : []
            });
            setTodoDraft('');
        }
    }, [task]);

    if (!isOpen || !task) return null;

    const handleChange = (field, value) => setEditedTask({ ...editedTask, [field]: value });
    const todos = Array.isArray(editedTask.todos) ? editedTask.todos : [];
    const todoProgress = getTodoProgress(editedTask);

    const updateTodos = (nextTodos) => handleChange('todos', nextTodos);

    const handleAddTodo = () => {
        const title = todoDraft.trim();
        if (!title) return;

        updateTodos([
            ...todos,
            {
                id: `td${Date.now().toString()}`,
                title,
                done: false,
                picId: ''
            }
        ]);
        setTodoDraft('');
    };

    const handleToggleTodo = (id) => {
        updateTodos(todos.map(todo => todo.id === id ? { ...todo, done: !todo.done } : todo));
    };

    const handleUpdateTodoTitle = (id, title) => {
        updateTodos(todos.map(todo => todo.id === id ? { ...todo, title } : todo));
    };

    const handleUpdateTodoPic = (id, picId) => {
        updateTodos(todos.map(todo => todo.id === id ? { ...todo, picId } : todo));
    };

    const handleDeleteTodo = (id) => {
        updateTodos(todos.filter(todo => todo.id !== id));
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white/95 rounded-[28px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-white/80 backdrop-blur">
                <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-white/70">
                    <div className="text-sm font-medium text-gray-500 flex items-center">
                        <i className="fa-regular fa-file-lines mr-2"></i> {task.isNew ? 'Tugas Baru' : 'Detail Tugas'}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    <input 
                        type="text" 
                        autoFocus
                        value={editedTask.title || ''} 
                        onChange={(e) => handleChange('title', e.target.value)}
                        className="w-full text-2xl font-bold text-gray-800 placeholder-gray-300 border-none focus:outline-none focus:ring-0 mb-6 bg-transparent"
                        placeholder="Nama Tugas..."
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-4 mb-2">
                        <div className="flex flex-col md:col-span-2">
                            <label className="text-xs font-medium text-gray-500 mb-1 flex items-center"><i className="fa-regular fa-folder mr-1.5 w-4 text-center"></i> Project</label>
                            <select 
                                value={editedTask.projectId || ''} 
                                onChange={(e) => handleChange('projectId', e.target.value)}
                                className="text-sm border border-slate-200 rounded-2xl p-2.5 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none bg-white cursor-pointer"
                            >
                                <option value="">-- Pilih Project --</option>
                                {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-500 mb-1 flex items-center"><i className="fa-solid fa-signal mr-1.5 w-4 text-center"></i> Status</label>
                            <select 
                                value={editedTask.status || 'To Do'} 
                                onChange={(e) => handleChange('status', e.target.value)}
                                className="text-sm border border-slate-200 rounded-2xl p-2.5 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none bg-white cursor-pointer"
                            >
                                {COLUMNS.map(col => <option key={col} value={col}>{col}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-500 mb-1 flex items-center"><i className="fa-regular fa-flag mr-1.5 w-4 text-center"></i> Prioritas</label>
                            <select 
                                value={editedTask.priority || 'Medium'} 
                                onChange={(e) => handleChange('priority', e.target.value)}
                                className="text-sm border border-slate-200 rounded-2xl p-2.5 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none bg-white cursor-pointer"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-500 mb-1 flex items-center"><i className="fa-regular fa-user mr-1.5 w-4 text-center"></i> Penanggung Jawab (PIC)</label>
                            <select 
                                value={editedTask.picId || ''} 
                                onChange={(e) => handleChange('picId', e.target.value)}
                                className="text-sm border border-slate-200 rounded-2xl p-2.5 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none bg-white cursor-pointer"
                            >
                                <option value="">{ALL_MARKOM_LABEL}</option>
                                {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.position})</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs font-medium text-gray-500 mb-1 flex items-center"><i className="fa-regular fa-calendar mr-1.5 w-4 text-center"></i> Tenggat Waktu</label>
                            <input 
                                type="date" 
                                value={editedTask.deadline || ''} 
                                onChange={(e) => handleChange('deadline', e.target.value)}
                                className="text-sm border border-slate-200 rounded-2xl p-2.5 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none bg-white cursor-pointer w-full"
                            />
                        </div>
                    </div>

                    <div className="mt-6 border-t border-gray-100 pt-5">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-semibold text-gray-800 flex items-center">
                                <i className="fa-regular fa-square-check mr-2 text-gray-500"></i>
                                To Do Sub-Kegiatan
                            </label>
                            <span className="text-xs text-gray-500">{todoProgress.done}/{todoProgress.total} selesai</span>
                        </div>

                        <div className="space-y-2 mb-3">
                            {todos.map(todo => (
                                <div key={todo.id} className="grid grid-cols-[auto_1fr_160px_auto] max-sm:grid-cols-[auto_1fr_auto] items-center gap-2 group">
                                    <input
                                        type="checkbox"
                                        checked={!!todo.done}
                                        onChange={() => handleToggleTodo(todo.id)}
                                        className="w-4 h-4 rounded border-gray-300 accent-purple-600 flex-shrink-0"
                                    />
                                    <input
                                        type="text"
                                        value={todo.title}
                                        onChange={(e) => handleUpdateTodoTitle(todo.id, e.target.value)}
                                        className={`flex-1 text-sm border border-slate-200 rounded-2xl px-3 py-2 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 ${todo.done ? 'text-gray-400 line-through bg-slate-50' : 'text-gray-800 bg-white'}`}
                                    />
                                    <select
                                        value={todo.picId || ''}
                                        onChange={(e) => handleUpdateTodoPic(todo.id, e.target.value)}
                                        className="text-xs border border-slate-200 rounded-2xl px-3 py-2 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 bg-white text-slate-600 max-sm:col-start-2 max-sm:w-full"
                                        title="PIC sub-kegiatan"
                                    >
                                        <option value="">{ALL_MARKOM_LABEL}</option>
                                        {members.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteTodo(todo.id)}
                                        className="w-8 h-8 rounded-md text-gray-300 hover:text-red-600 hover:bg-red-50"
                                        title="Hapus sub-kegiatan"
                                    >
                                        <i className="fa-regular fa-trash-can text-xs"></i>
                                    </button>
                                </div>
                            ))}
                            {todos.length === 0 && (
                                <div className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-md px-3 py-4 text-center">
                                    Belum ada sub-kegiatan.
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={todoDraft}
                                onChange={(e) => setTodoDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddTodo();
                                    }
                                }}
                                placeholder="Tambah sub-kegiatan..."
                                className="flex-1 text-sm border border-slate-200 rounded-2xl px-3 py-2 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                            />
                            <button
                                type="button"
                                onClick={handleAddTodo}
                                disabled={!todoDraft.trim()}
                                className="px-4 py-2 text-sm font-medium bg-slate-950 text-white rounded-2xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Tambah
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-slate-100 bg-slate-50/70 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors">
                        Batal
                    </button>
                    <button 
                        onClick={async () => {
                            if (!editedTask.projectId) return;
                            const saved = await onSave(editedTask);
                            if (saved !== false) onClose();
                        }} 
                        disabled={!editedTask.title?.trim() || !editedTask.projectId}
                        className="px-5 py-2 text-sm font-medium text-white bg-slate-950 rounded-2xl hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Simpan Tugas
                    </button>
                </div>
            </div>
        </div>
    );
};

const CustomDialog = ({ dialog, closeDialog }) => {
    const [inputValue, setInputValue] = useState(dialog.defaultValue || '');
    const [inputPosValue, setInputPosValue] = useState('');

    useEffect(() => {
        setInputValue(dialog.defaultValue || '');
        setInputPosValue('');
    }, [dialog.isOpen, dialog.defaultValue]);

    if (!dialog.isOpen) return null;

    const handleConfirm = () => {
        if (dialog.type === 'prompt' || dialog.type === 'member_prompt') {
            if (!inputValue.trim() && dialog.required) return;
            if(dialog.type === 'member_prompt') {
                if (!inputPosValue.trim() && dialog.required) return;
                dialog.onConfirm(inputValue, inputPosValue);
            } else {
                dialog.onConfirm(inputValue);
            }
        } else {
            dialog.onConfirm();
        }
        closeDialog();
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{dialog.message}</h3>
                
                {(dialog.type === 'prompt' || dialog.type === 'member_prompt') && (
                    <div className="space-y-3 mb-4">
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (dialog.type !== 'member_prompt' || inputPosValue.trim()) && handleConfirm()}
                            placeholder={dialog.placeholder || "Ketik di sini..."}
                            autoFocus
                        />
                        {dialog.type === 'member_prompt' && (
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-md px-3 py-2.5 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                                value={inputPosValue}
                                onChange={(e) => setInputPosValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && inputValue.trim() && handleConfirm()}
                                placeholder="Posisi / Jabatan (misal: Content Writer)"
                            />
                        )}
                    </div>
                )}
                <div className="flex justify-end space-x-3 mt-2">
                    <button onClick={closeDialog} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                        Batal
                    </button>
                    <button 
                        onClick={handleConfirm} 
                        disabled={
                            (dialog.type === 'prompt' && dialog.required && !inputValue.trim()) || 
                            (dialog.type === 'member_prompt' && dialog.required && (!inputValue.trim() || !inputPosValue.trim()))
                        }
                        className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {dialog.type === 'prompt' || dialog.type === 'member_prompt' ? 'Simpan' : 'Ya, Lanjutkan'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const TaskCard = ({ task, members, projects = [], onEdit, onDelete, onUpdatePriority, onUpdateStatus, onUpdateTask, isListView = false }) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(task.title);
    const [isEditingDeadline, setIsEditingDeadline] = useState(false);
    const [editedDeadline, setEditedDeadline] = useState(task.deadline || '');
    const [isEditingPic, setIsEditingPic] = useState(false);

    useEffect(() => {
        setEditedTitle(task.title);
        setEditedDeadline(task.deadline || '');
    }, [task.title, task.deadline]);

    const handleTitleSubmit = () => {
        setIsEditingTitle(false);
        if (editedTitle.trim() !== task.title && editedTitle.trim() !== '') {
            onUpdateTask({ ...task, title: editedTitle.trim() });
        } else {
            setEditedTitle(task.title);
        }
    };

    const handleDeadlineSubmit = () => {
        setIsEditingDeadline(false);
        if (editedDeadline !== task.deadline) {
            onUpdateTask({ ...task, deadline: editedDeadline });
        }
    };

    const toggleStatusDone = (e) => {
        e.stopPropagation();
        const newStatus = e.target.checked ? 'Done' : 'To Do';
        onUpdateStatus(task.id, newStatus);
    };

    const togglePriority = (e) => {
        e.stopPropagation();
        const levels = ['Low', 'Medium', 'High'];
        const next = levels[(levels.indexOf(task.priority) + 1) % levels.length];
        onUpdatePriority(task.id, next);
    };

    const handleDragStart = (e) => {
        e.dataTransfer.setData('taskId', task.id);
        setTimeout(() => e.target.classList.add('opacity-50', 'dragging'), 0);
    };
    const handleDragEnd = (e) => {
        e.target.classList.remove('opacity-50', 'dragging');
    };

    const deadlineState = getDeadlineState(task.deadline, task.status);
    const isOverdue = deadlineState === 'overdue';
    const isDueToday = deadlineState === 'today';
    const isDone = task.status === 'Done';
    const pic = members.find(m => m.id === task.picId);
    const todoProgress = getTodoProgress(task);
    const project = projects.find(p => p.id === task.projectId);
    const accentColor = project?.color || '#7c3aed';

    if (isListView) {
        return (
            <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors group" style={{ borderLeft: `3px solid ${accentColor}` }}>
                <td className="p-3">
                    <div className="flex items-start space-x-3">
                        <input
                            type="checkbox"
                            checked={isDone}
                            onChange={toggleStatusDone}
                            className="mt-1 w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer accent-purple-600 flex-shrink-0"
                            title="Tandai Selesai"
                        />
                        <div className="flex flex-col flex-1">
                            {isEditingTitle ? (
                                <input 
                                    type="text" 
                                    autoFocus 
                                    value={editedTitle} 
                                    onChange={(e) => setEditedTitle(e.target.value)} 
                                    onBlur={handleTitleSubmit} 
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleTitleSubmit();
                                        if (e.key === 'Escape') { setEditedTitle(task.title); setIsEditingTitle(false); }
                                    }}
                                    className="text-sm font-medium text-gray-900 border-b-2 border-purple-500 outline-none bg-transparent p-0 w-full max-w-md"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }} 
                                    className={`text-left text-sm font-medium hover:bg-gray-100 rounded px-1 -ml-1 truncate max-w-md transition-colors ${isDone ? 'text-gray-400 line-through' : 'text-gray-900 hover:text-purple-600'}`}
                                >
                                    {task.title}
                                </button>
                            )}
                            <div className="mt-1.5 flex">
                                {isEditingDeadline ? (
                                    <input
                                        type="date"
                                        autoFocus
                                        value={editedDeadline}
                                        onChange={(e) => setEditedDeadline(e.target.value)}
                                        onBlur={handleDeadlineSubmit}
                                        className="text-[11px] border border-purple-500 rounded px-1 outline-none h-6"
                                    />
                                ) : (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setIsEditingDeadline(true); }} 
                                        className={`text-[11px] font-medium flex items-center hover:bg-gray-200 px-1 py-0.5 rounded -ml-1 transition-colors ${isOverdue ? 'text-red-500' : isDueToday ? 'text-orange-600' : 'text-gray-500'}`}
                                    >
                                        <i className="fa-regular fa-calendar mr-1.5"></i> 
                                        {task.deadline ? formatDeadline(task.deadline) : 'Set Deadline'}
                                        {isOverdue && <span className="ml-2 px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">Overdue</span>}
                                        {isDueToday && <span className="ml-2 px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">Hari Ini</span>}
                                    </button>
                                )}
                            </div>
                            {todoProgress.total > 0 && (
                                <div className="mt-1 text-[11px] text-gray-500 flex items-center">
                                    <i className="fa-regular fa-square-check mr-1"></i>
                                    {todoProgress.done}/{todoProgress.total} sub-kegiatan
                                </div>
                            )}
                        </div>
                    </div>
                </td>
                <td className="p-3 text-sm text-gray-600">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs border border-gray-200">{task.status}</span>
                </td>
                <td className="p-3 text-sm">
                    <button onClick={togglePriority} className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center space-x-1 ${PRIORITIES[task.priority].color} hover:opacity-80 transition-opacity w-fit`}>
                        <i className={`fa-solid ${PRIORITIES[task.priority].icon}`}></i>
                        <span>{task.priority}</span>
                    </button>
                </td>
                <td className="p-3 text-sm relative">
                    {isEditingPic ? (
                        <select
                            autoFocus
                            value={task.picId || ''}
                            onChange={(e) => {
                                setIsEditingPic(false);
                                onUpdateTask({ ...task, picId: e.target.value });
                            }}
                            onBlur={() => setIsEditingPic(false)}
                            className="text-xs border border-purple-500 rounded outline-none p-1 bg-white absolute z-10 top-2"
                        >
                            <option value="">{ALL_MARKOM_LABEL}</option>
                            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    ) : (
                        <button onClick={(e) => { e.stopPropagation(); setIsEditingPic(true); }} className="flex items-center space-x-2 focus:outline-none hover:bg-gray-100 p-1 rounded -ml-1 transition-colors" title={pic ? `${pic.name} (${pic.position})` : 'Set PIC'}>
                            {pic ? (
                                <>
                                    <div className="w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold shadow-sm" style={{ backgroundColor: pic.color }}>
                                        {getInitials(pic.name)}
                                    </div>
                                    <span className="text-gray-700 text-xs truncate max-w-[80px]">{pic.name}</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-6 h-6 rounded-full bg-gray-50 border border-dashed border-gray-300 text-gray-400 flex items-center justify-center text-[10px]">
                                        <i className="fa-solid fa-user-plus"></i>
                                    </div>
                                    <span className="text-gray-400 text-xs italic">Set PIC</span>
                                </>
                            )}
                        </button>
                    )}
                </td>
                <td className="p-3 text-sm text-right">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(task)} className="text-gray-400 hover:text-gray-700 p-1.5 rounded hover:bg-gray-100" title="Detail Lengkap">
                            <i className="fa-solid fa-expand"></i>
                        </button>
                        <button onClick={() => onDelete(task.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded" title="Hapus">
                            <i className="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <div
            draggable="true"
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`bg-white/80 p-3.5 rounded-3xl border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing group mb-3 relative flex flex-col min-h-[110px] backdrop-blur ${isDone ? 'border-white/60 bg-white/45' : 'border-white/75'}`}
            style={{ borderLeft: `3px solid ${accentColor}` }}
        >
            <div className="flex justify-between items-start mb-2">
                <button onClick={togglePriority} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${PRIORITIES[task.priority].color} hover:opacity-80 flex items-center`}>
                    <i className={`fa-solid ${PRIORITIES[task.priority].icon} mr-1`}></i>
                    {task.priority}
                </button>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onDelete(task.id)} className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50"><i className="fa-regular fa-trash-can text-xs"></i></button>
                </div>
            </div>
            
            <div className="flex items-start mb-3">
                <input
                    type="checkbox"
                    checked={isDone}
                    onChange={toggleStatusDone}
                    className="mt-1.5 mr-2 w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer accent-purple-600 flex-shrink-0"
                    title="Tandai Selesai"
                />
                <div className="flex-1 w-full overflow-hidden">
                    {isEditingTitle ? (
                        <textarea 
                            autoFocus 
                            value={editedTitle} 
                            onChange={(e) => setEditedTitle(e.target.value)} 
                            onBlur={handleTitleSubmit} 
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTitleSubmit(); }
                                if (e.key === 'Escape') { setEditedTitle(task.title); setIsEditingTitle(false); }
                            }}
                            className="text-sm font-medium text-gray-800 leading-snug border-b-2 border-purple-500 outline-none bg-transparent p-0 w-full resize-none overflow-hidden"
                            rows={editedTitle.length > 30 ? 2 : 1}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <h4 
                            className={`text-sm font-medium leading-snug cursor-text hover:bg-gray-100 rounded px-1 py-0.5 -ml-1 transition-colors ${isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`} 
                            onClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }}
                        >
                            {task.title}
                        </h4>
                    )}
                </div>
            </div>

            {todoProgress.total > 0 && (
                <div className="mb-3 ml-6 flex items-center gap-2">
                    <div className="relative flex items-center justify-center shrink-0">
                        <ProgressRing percent={Math.round((todoProgress.done / todoProgress.total) * 100)} size={26} stroke={3} color="#059669" trackColor="#d1fae5" />
                    </div>
                    <span className="text-[10px] text-gray-500"><i className="fa-regular fa-square-check mr-1"></i>{todoProgress.done}/{todoProgress.total} sub-kegiatan</span>
                </div>
            )}

            <div className="pt-2 border-t border-gray-100 flex justify-between items-center mt-auto">
                <div className="flex items-center">
                    {isEditingDeadline ? (
                        <input
                            type="date"
                            autoFocus
                            value={editedDeadline}
                            onChange={(e) => setEditedDeadline(e.target.value)}
                            onBlur={handleDeadlineSubmit}
                            className="text-[10px] border border-purple-500 rounded px-1 py-0.5 outline-none w-24 h-6"
                        />
                    ) : (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsEditingDeadline(true); }} 
                            className={`text-[10px] font-medium flex items-center bg-gray-50 px-1.5 py-1 rounded border hover:bg-gray-100 transition-colors ${isOverdue ? 'border-red-200 text-red-600 bg-red-50' : isDueToday ? 'border-orange-200 text-orange-600 bg-orange-50' : 'border-gray-200 text-gray-500'}`}
                        >
                            <i className="fa-regular fa-calendar mr-1"></i> {task.deadline ? formatDeadline(task.deadline) : 'Set Deadline'}
                            {isOverdue && <span className="ml-1 font-bold">Overdue</span>}
                            {isDueToday && <span className="ml-1 font-bold">Hari Ini</span>}
                        </button>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    <button onClick={() => onEdit(task)} className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100" title="Detail Lengkap">
                        <i className="fa-solid fa-expand text-xs"></i>
                    </button>
                    <div className="relative flex items-center">
                        {isEditingPic ? (
                            <select
                                autoFocus
                                value={task.picId || ''}
                                onChange={(e) => {
                                    setIsEditingPic(false);
                                    onUpdateTask({ ...task, picId: e.target.value });
                                }}
                                onBlur={() => setIsEditingPic(false)}
                                className="text-[10px] border border-purple-500 rounded outline-none p-0.5 bg-white absolute right-0 bottom-0 min-w-[90px] z-10"
                            >
                                <option value="">{ALL_MARKOM_LABEL}</option>
                                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        ) : (
                            <button onClick={(e) => { e.stopPropagation(); setIsEditingPic(true); }} className="focus:outline-none flex items-center" title={pic ? `${pic.name} - ${pic.position}` : 'Set PIC'}>
                                {pic ? (
                                    <div className="w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold shadow-sm" style={{ backgroundColor: pic.color }}>
                                        {getInitials(pic.name)}
                                    </div>
                                ) : (
                    <div className="w-6 h-6 rounded-full bg-white/70 border border-dashed border-slate-300 text-slate-400 flex items-center justify-center text-[10px] hover:bg-white transition-colors">
                                        <i className="fa-solid fa-user-plus"></i>
                                    </div>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const KanbanView = ({ tasks, members, projects, onAdd, onEdit, onDelete, onUpdatePriority, onUpdateStatus, onUpdateTask }) => {
    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-gray-200', 'border-gray-400', 'border-dashed');
    };
    
    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('bg-gray-200', 'border-gray-400', 'border-dashed');
    };

    const handleDrop = (e, status) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-gray-200', 'border-gray-400', 'border-dashed');
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            onUpdateStatus(taskId, status);
        }
    };

    return (
        <div className="flex h-full gap-4 overflow-x-auto pb-4 w-full">
            {COLUMNS.map(column => {
                const columnTasks = tasks.filter(t => t.status === column);
                const tint = COLUMN_TINTS[column] || COLUMN_TINTS['To Do'];
                return (
                    <div key={column} className="flex-1 min-w-[280px] flex flex-col">
                        <div className={`flex items-center justify-between mb-3 px-3 py-2 rounded-2xl ${tint.header}`}>
                            <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-sm text-slate-800">{column}</h3>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${tint.chip}`}>{columnTasks.length}</span>
                            </div>
                            <button onClick={() => onAdd(column)} className="text-slate-400 hover:text-slate-800 p-1 rounded hover:bg-white/60 transition-colors">
                                <i className="fa-solid fa-plus"></i>
                            </button>
                        </div>

                        <div
                            className={`flex-1 rounded-3xl p-3 transition-colors border min-h-[500px] ${tint.drop}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, column)}
                        >
                            {columnTasks.map(task => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    members={members}
                                    projects={projects}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onUpdatePriority={onUpdatePriority}
                                    onUpdateStatus={onUpdateStatus}
                                    onUpdateTask={onUpdateTask}
                                />
                            ))}

                            <button
                                onClick={() => onAdd(column)}
                                className="w-full mt-1 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-200 py-2 rounded-md flex items-center space-x-2 px-2 transition-colors text-left"
                            >
                                <i className="fa-solid fa-plus text-xs"></i>
                                <span>New Task</span>
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const TableView = ({ tasks, members, projects, onAdd, onEdit, onDelete, onUpdatePriority, onUpdateStatus, onUpdateTask }) => {
    return (
        <div className="bg-white/75 rounded-3xl border border-white/70 shadow-xl shadow-slate-200/50 overflow-hidden animate-fade-in backdrop-blur">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/60 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <th className="p-3 font-medium">Nama Tugas & Deadline</th>
                            <th className="p-3 font-medium w-32">Status</th>
                            <th className="p-3 font-medium w-32">Prioritas</th>
                            <th className="p-3 font-medium w-40">PIC</th>
                            <th className="p-3 font-medium w-24 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white/60">
                        {tasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                members={members}
                                projects={projects}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onUpdatePriority={onUpdatePriority}
                                onUpdateStatus={onUpdateStatus}
                                onUpdateTask={onUpdateTask}
                                isListView={true}
                            />
                        ))}
                        {tasks.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-gray-500 text-sm">
                                    Belum ada tugas di project ini.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-4 border-t border-slate-100 bg-white/55">
                <button onClick={() => onAdd('To Do')} className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center space-x-2">
                    <i className="fa-solid fa-plus"></i>
                    <span>Tambah Tugas Baru</span>
                </button>
            </div>
        </div>
    );
};

const MembersTable = ({ members, onAddMember, onDeleteMember }) => {
    return (
        <div className="bg-white/75 rounded-3xl border border-white/70 shadow-xl shadow-slate-200/50 overflow-hidden animate-fade-in max-w-3xl backdrop-blur">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 tint-mint">
                <h3 className="font-semibold flex items-center"><i className="fa-solid fa-users mr-2"></i> Daftar Tim</h3>
                <button onClick={onAddMember} className="tint-mint-solid px-3 py-1.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity shadow-sm flex items-center">
                    <i className="fa-solid fa-plus mr-1.5 text-xs"></i> Tambah Anggota
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/60 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <th className="p-3 font-medium w-16 text-center">Avatar</th>
                            <th className="p-3 font-medium">Nama Anggota</th>
                            <th className="p-3 font-medium">Posisi / Jabatan</th>
                            <th className="p-3 font-medium w-24 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white/60 divide-y divide-slate-100">
                        {members.map(member => (
                            <tr key={member.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="p-3 text-center">
                                    <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold mx-auto shadow-sm" style={{ backgroundColor: member.color }}>
                                        {getInitials(member.name)}
                                    </div>
                                </td>
                                <td className="p-3 text-sm font-medium text-gray-900">{member.name}</td>
                                <td className="p-3 text-sm text-gray-600">{member.position}</td>
                                <td className="p-3 text-sm text-right">
                                    <button onClick={() => onDeleteMember(member.id)} className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity" title="Hapus Anggota">
                                        <i className="fa-regular fa-trash-can"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {members.length === 0 && (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-gray-500 text-sm">Belum ada anggota tim.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const DashboardTaskList = ({ title, tasks, projects, members, tone, emptyText, onEdit }) => {
    const toneClass = {
        red: 'border-red-200 bg-red-50 text-red-700',
        orange: 'border-orange-200 bg-orange-50 text-orange-700',
        blue: 'border-blue-200 bg-blue-50 text-blue-700',
        purple: 'border-purple-200 bg-purple-50 text-purple-700',
        gray: 'border-gray-200 bg-gray-50 text-gray-700'
    }[tone] || 'border-gray-200 bg-gray-50 text-gray-700';

    return (
        <div className="border border-white/70 rounded-3xl bg-white/75 overflow-hidden shadow-xl shadow-slate-200/40 backdrop-blur">
            <div className={`px-4 py-2 border-b text-sm font-semibold flex items-center justify-between ${toneClass}`}>
                <span>{title}</span>
                <span>{tasks.length}</span>
            </div>
            <div className="divide-y divide-gray-100">
                {tasks.map(task => {
                    const project = projects.find(p => p.id === task.projectId);
                    const member = members.find(m => m.id === task.picId);
                    return (
                        <button
                            key={task.id}
                            onClick={() => onEdit(task)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">{task.title}</div>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                        <span><i className="fa-regular fa-folder mr-1"></i>{project?.name || 'Tanpa Project'}</span>
                                        <span><i className="fa-regular fa-user mr-1"></i>{member?.name || ALL_MARKOM_LABEL}</span>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="text-xs font-medium text-gray-700">{task.deadline ? formatDeadline(task.deadline) : '-'}</div>
                                    <div className={`inline-flex mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${PRIORITIES[task.priority]?.color || 'text-gray-700 bg-gray-100'}`}>
                                        {task.priority}
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
                {tasks.length === 0 && (
                    <div className="px-4 py-6 text-sm text-gray-400 text-center">{emptyText}</div>
                )}
            </div>
        </div>
    );
};

const FavoriteShortcuts = ({ shortcuts }) => {
    const favoriteShortcuts = shortcuts.filter(shortcut => shortcut.isFavorite).slice(0, 12);

    const visibleShortcuts = favoriteShortcuts.length ? favoriteShortcuts : shortcuts.slice(0, 6);

    return (
        <div className="border border-white/70 rounded-3xl bg-white/75 overflow-hidden shadow-xl shadow-slate-200/40 backdrop-blur">
            <div className="px-4 py-3 border-b border-slate-100">
                <div className="text-sm font-semibold text-gray-800">Shortcut Favorit</div>
                <div className="text-xs text-gray-500 mt-0.5">Kelola favorit lewat tombol grid kanan atas.</div>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
                {visibleShortcuts.map(shortcut => (
                    <a
                        key={shortcut.id}
                        href={shortcut.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 border border-white/70 rounded-2xl bg-white/70 px-3 py-2 text-sm hover:bg-white hover:border-slate-200 transition-colors min-w-0 shadow-sm"
                    >
                        <span className="w-7 h-7 rounded-md text-white flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: shortcut.color || '#2563eb' }}>
                            {(shortcut.icon || getInitials(shortcut.title)).substring(0, 3).toUpperCase()}
                        </span>
                        <span className="font-medium text-gray-800 truncate">{shortcut.title}</span>
                    </a>
                ))}
                {visibleShortcuts.length === 0 && (
                    <div className="col-span-2 px-3 py-6 text-sm text-gray-400 text-center">Belum ada shortcut.</div>
                )}
            </div>
        </div>
    );
};

const SidebarLottie = ({ picName = '' }) => {
    const displayPicName = picName?.trim() || 'Tim';
    const catLabel = `Meow ${displayPicName}!`;

    const getCatMessage = () => {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        if (currentMinutes >= 8 * 60 && currentMinutes < 10 * 60) {
            return { text: '“Pagi Manis! Semangat bekerja 😼”' };
        }

        if (currentMinutes >= 10 * 60 && currentMinutes < 11 * 60 + 30) {
            return { text: '“Tetap Fokus walau mulai lapar 😼”' };
        }

        if (currentMinutes >= 11 * 60 + 30 && currentMinutes < 13 * 60) {
            return { text: '“Jangan lupa makan siang yah 🍱”' };
        }

        if (currentMinutes >= 13 * 60 && currentMinutes < 16 * 60) {
            return { text: '“Jam rawan nih! Yuk Minum dulu😼”' };
        }

        return { text: '“Waktunya Pulang, Hati2 dijalan 🌙”' };
    };

    const [catMessage, setCatMessage] = useState({
        text: '“Meong, siap menemani.”'
    });

    useEffect(() => {
        const updateMessage = () => setCatMessage(getCatMessage());
        updateMessage();
        const timer = setInterval(updateMessage, 60 * 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="mx-4 mb-3 rounded-3xl border border-white/70 bg-white/70 p-3 shadow-xl shadow-slate-200/40 backdrop-blur">
            <div className="flex items-center gap-2">
                <div className="h-28 w-[92px] shrink-0 overflow-hidden rounded-2xl bg-white/40">
                    <iframe
                        title="Kucing Markom"
                        src="https://lottie.host/embed/2b4ca9fe-db32-4fb7-9183-b4818396aee4/jtijKh5OVk.json"
                        className="h-full w-full scale-110 border-0"
                        loading="lazy"
                        allow="autoplay"
                        referrerPolicy="no-referrer"
                    />
                </div>

                <div className="relative flex-1 rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-sm">
                    <span className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b border-l border-white/80 bg-white/90"></span>
                    <div className="relative text-[9px] font-bold uppercase tracking-[0.14em] text-indigo-500">
                        {catLabel}
                    </div>
                    <div className="relative mt-1 text-[11px] font-semibold leading-snug text-slate-800">
                        {catMessage.text}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SidebarClock = () => {
    const [time, setTime] = useState('--:--:--');
    const [date, setDate] = useState('');

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const hours24 = now.getHours();
            const suffix = hours24 >= 12 ? 'PM' : 'AM';
            const hours12 = hours24 % 12 || 12;
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            setTime(`${String(hours12).padStart(2, '0')}:${minutes}:${seconds} ${suffix}`);
            setDate(now.toLocaleDateString('id-ID', {
                weekday: 'short',
                day: '2-digit',
                month: 'short'
            }));
        };

        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="mx-4 mb-4 rounded-3xl p-4 text-white shadow-xl shadow-violet-300/30" style={{ backgroundImage: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%)' }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Bitcount+Single:wght@500&display=swap');`}</style>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/55">Waktu Saat Ini</div>
            <div className="mt-2 text-2xl tracking-tight leading-none" style={{ fontFamily: "'Bitcount Single', monospace", fontWeight: 500 }}>{time}</div>
            <div className="mt-1 text-xs font-medium text-white/70">{date}</div>
        </div>
    );
};

const ProjectRiskPanel = ({ rows }) => {
    return (
        <div className="border border-white/70 rounded-3xl bg-white/75 overflow-hidden shadow-xl shadow-slate-200/40 backdrop-blur">
            <div className="px-4 py-3 border-b border-slate-100 font-semibold text-sm text-gray-800">Project Berisiko</div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/60 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <th className="p-3 font-medium">Project</th>
                            <th className="p-3 font-medium text-center">Aktif</th>
                            <th className="p-3 font-medium text-center">Overdue</th>
                            <th className="p-3 font-medium text-center">Hari Ini</th>
                            <th className="p-3 font-medium text-center">Minggu Ini</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => (
                            <tr key={row.id} className="border-b border-gray-100 last:border-0">
                                <td className="p-3 text-sm font-medium text-gray-900">{row.name}</td>
                                <td className="p-3 text-sm text-center text-gray-700 font-semibold">{row.active}</td>
                                <td className="p-3 text-sm text-center text-red-700 font-semibold">{row.overdue}</td>
                                <td className="p-3 text-sm text-center text-orange-700 font-semibold">{row.today}</td>
                                <td className="p-3 text-sm text-center text-gray-700 font-semibold">{row.week}</td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-6 text-center text-sm text-gray-400">Tidak ada project berisiko.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const QuickAddTask = ({ projects, members, defaultPicId = '', onAddTask }) => {
    const [form, setForm] = useState({
        title: '',
        projectId: projects[0]?.id || '',
        deadline: '',
        priority: 'Medium',
        picId: defaultPicId || ''
    });

    useEffect(() => {
        if (!form.projectId && projects[0]?.id) {
            setForm(prev => ({ ...prev, projectId: projects[0].id }));
        }
    }, [projects, form.projectId]);

    useEffect(() => {
        if (defaultPicId) {
            setForm(prev => ({ ...prev, picId: prev.picId || defaultPicId }));
        }
    }, [defaultPicId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.projectId) return;

        const saved = await onAddTask({
            title: form.title.trim(),
            projectId: form.projectId,
            deadline: form.deadline,
            priority: form.priority,
            picId: form.picId
        });

        if (!saved) return;
        setForm(prev => ({ ...prev, title: '', deadline: '', picId: defaultPicId || prev.picId || '' }));
    };

    return (
        <form onSubmit={handleSubmit} className="border border-white/70 rounded-3xl bg-white/75 p-3 mb-5 shadow-xl shadow-slate-200/40 backdrop-blur">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative w-full sm:flex-1 sm:min-w-[240px]">
                    <i className="fa-solid fa-plus absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                    <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Quick add task..."
                        className="w-full border border-gray-300 rounded-md pl-8 pr-3 py-2 text-sm outline-none focus:border-gray-700 focus:ring-1 focus:ring-gray-700"
                    />
                </div>
                <select
                    value={form.projectId}
                    onChange={(e) => setForm(prev => ({ ...prev, projectId: e.target.value }))}
                    className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 text-sm bg-white outline-none focus:border-gray-700 focus:ring-1 focus:ring-gray-700"
                >
                    {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
                <select
                    value={form.picId}
                    onChange={(e) => setForm(prev => ({ ...prev, picId: e.target.value }))}
                    className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 text-sm bg-white outline-none focus:border-gray-700 focus:ring-1 focus:ring-gray-700"
                >
                    <option value="">{ALL_MARKOM_LABEL}</option>
                    {members.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                </select>
                <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-gray-700 focus:ring-1 focus:ring-gray-700"
                />
                <select
                    value={form.priority}
                    onChange={(e) => setForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 text-sm bg-white outline-none focus:border-gray-700 focus:ring-1 focus:ring-gray-700"
                >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
                <button
                    type="submit"
                    disabled={!form.title.trim() || !form.projectId}
                    className="w-full sm:w-auto bg-black text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Tambah
                </button>
            </div>
        </form>
    );
};

const DashboardProjectMonthPanel = ({ rows }) => {
    return (
        <div className="border border-white/70 rounded-3xl bg-white/75 overflow-hidden shadow-xl shadow-slate-200/40 backdrop-blur">
            <div className="px-4 py-3 border-b border-slate-100">
                <div className="text-sm font-semibold text-gray-800">Project Bulan Ini</div>
                <div className="text-xs text-gray-500 mt-0.5">Project dengan deadline di bulan berjalan.</div>
            </div>
            <div className="divide-y divide-slate-100">
                {rows.map(row => (
                    <div key={row.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: row.color || '#2563eb' }}></span>
                                    <div className="text-sm font-semibold text-slate-900 truncate">{row.name}</div>
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                    {row.total} task bulan ini · {row.done} selesai
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-xs font-medium text-slate-700">{row.nearestDeadline ? formatDeadline(row.nearestDeadline) : '-'}</div>
                                <div className="mt-1 text-[10px] font-semibold text-orange-700 bg-orange-100 rounded px-1.5 py-0.5 inline-flex">
                                    {row.active} aktif
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {rows.length === 0 && (
                    <div className="px-4 py-8 text-sm text-gray-400 text-center">Belum ada project dengan deadline bulan ini.</div>
                )}
            </div>
        </div>
    );
};

const MiniDashboardCalendar = ({ tasks, projects, onEdit }) => {
    const [selectedDateKey, setSelectedDateKey] = useState(null);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const leadingDays = (monthStart.getDay() + 6) % 7;
    const calendarStart = addDays(monthStart, -leadingDays);
    const calendarDays = Array.from({ length: 42 }, (_, index) => addDays(calendarStart, index));
    const monthLabel = today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const weekDays = ['S', 'S', 'R', 'K', 'J', 'S', 'M'];

    const tasksByDate = tasks
        .filter(task => task.deadline)
        .reduce((groups, task) => {
            const dueDate = getDateOnly(task.deadline);
            if (!dueDate || dueDate < monthStart || dueDate > monthEnd) return groups;
            const key = toDateInputValue(dueDate);
            groups[key] = groups[key] || [];
            groups[key].push(task);
            return groups;
        }, {});

    Object.keys(tasksByDate).forEach(key => {
        tasksByDate[key].sort((a, b) => {
            const priorityRank = { High: 3, Medium: 2, Low: 1 };
            if (a.status === 'Done' && b.status !== 'Done') return 1;
            if (a.status !== 'Done' && b.status === 'Done') return -1;
            return (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
        });
    });

    const selectedTasks = selectedDateKey ? (tasksByDate[selectedDateKey] || []) : [];
    const selectedDateLabel = selectedDateKey ? formatDeadline(selectedDateKey) : '';
    const taskListPopup = typeof document !== 'undefined' && selectedDateKey ? createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/20 p-4 animate-fade-in">
            <button
                type="button"
                aria-label="Tutup daftar task"
                onClick={() => setSelectedDateKey(null)}
                className="absolute inset-0 cursor-default"
            />
            <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-2xl shadow-slate-900/20">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                        <div className="text-sm font-semibold text-slate-900">Task {selectedDateLabel}</div>
                        <div className="text-xs text-slate-400">{selectedTasks.length} task deadline hari ini</div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSelectedDateKey(null)}
                        className="h-8 w-8 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                    {selectedTasks.map(task => {
                        const project = projects.find(project => project.id === task.projectId);
                        const projectColor = project?.color || '#2563eb';

                        return (
                            <button
                                key={task.id}
                                onClick={() => {
                                    setSelectedDateKey(null);
                                    onEdit(task);
                                }}
                                className="w-full px-5 py-4 text-left transition-colors hover:bg-slate-50"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-slate-900 truncate">{task.title}</div>
                                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: projectColor }}></span>
                                            <span className="truncate">{project?.name || 'Tanpa Project'}</span>
                                        </div>
                                    </div>
                                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITIES[task.priority]?.color || 'bg-slate-100 text-slate-600'}`}>
                                        {task.priority}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className="border border-white/70 rounded-3xl bg-white/75 overflow-hidden shadow-xl shadow-slate-200/40 backdrop-blur">
            <div className="px-4 py-3 border-b border-slate-100">
                <div className="text-sm font-semibold text-gray-800">Mini Kalender</div>
                <div className="text-xs text-gray-500 mt-0.5 capitalize">{monthLabel}</div>
            </div>
            <div className="p-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map((day, index) => (
                        <div key={`${day}-${index}`} className="text-center text-[10px] font-semibold text-slate-400 uppercase">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map(day => {
                        const dateKey = toDateInputValue(day);
                        const dayTasks = tasksByDate[dateKey] || [];
                        const isCurrentMonth = day.getMonth() === today.getMonth();
                        const isToday = day.getTime() === today.getTime();
                        const firstTask = dayTasks[0];
                        const project = firstTask ? projects.find(p => p.id === firstTask.projectId) : null;

                        return (
                            <button
                                key={dateKey}
                                onClick={() => firstTask && setSelectedDateKey(dateKey)}
                                disabled={!firstTask}
                                className={`relative h-10 rounded-2xl text-xs font-semibold transition-colors ${isToday ? 'bg-slate-950 text-white' : isCurrentMonth ? 'bg-white/70 text-slate-700 hover:bg-white' : 'bg-white/25 text-slate-300'} ${firstTask ? 'cursor-pointer' : 'cursor-default'}`}
                                title={firstTask ? `${dayTasks.length} task - klik untuk lihat daftar` : ''}
                            >
                                {day.getDate()}
                                {dayTasks.length > 0 && (
                                    <span
                                        className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
                                        style={{ backgroundColor: project?.color || '#2563eb' }}
                                    ></span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
            {taskListPopup}
        </div>
    );
};

const MainDashboard = ({ tasks, projects, members, shortcuts, currentPicId = '', onEdit, onQuickAddTask }) => {
    const [dashboardPicFilter, setDashboardPicFilter] = useState(currentPicId || 'all');

    useEffect(() => {
        setDashboardPicFilter(currentPicId || 'all');
    }, [currentPicId]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = getWeekEnd(today);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const filteredTasks = tasks.filter(task => {
        if (dashboardPicFilter === 'all') return true;
        if (dashboardPicFilter === 'none') return !task.picId;
        return task.picId === dashboardPicFilter;
    });

    const activeTasks = filteredTasks.filter(task => task.status !== 'Done');

    const dashboardStats = filteredTasks.reduce((stats, task) => {
        const deadlineState = getDeadlineState(task.deadline, task.status);
        return {
            total: stats.total + 1,
            done: stats.done + (task.status === 'Done' ? 1 : 0),
            overdue: stats.overdue + (deadlineState === 'overdue' ? 1 : 0),
            today: stats.today + (deadlineState === 'today' ? 1 : 0)
        };
    }, { total: 0, done: 0, overdue: 0, today: 0 });

    const sortedByDeadline = (items) => [...items].sort((a, b) => {
        const aTime = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
    });

    const focusTasks = sortedByDeadline(activeTasks.filter(task => {
        const dueDate = getDateOnly(task.deadline);
        return dueDate && dueDate >= today && dueDate <= weekEnd;
    }));

    const projectMonthRows = projects.map(project => {
        const monthTasks = filteredTasks.filter(task => {
            const dueDate = getDateOnly(task.deadline);
            return task.projectId === project.id && dueDate && dueDate >= monthStart && dueDate <= monthEnd;
        });
        const activeMonthTasks = monthTasks.filter(task => task.status !== 'Done');
        const nearestTask = sortedByDeadline(activeMonthTasks)[0] || sortedByDeadline(monthTasks)[0];

        return {
            id: project.id,
            name: project.name,
            color: project.color,
            total: monthTasks.length,
            active: activeMonthTasks.length,
            done: monthTasks.filter(task => task.status === 'Done').length,
            nearestDeadline: nearestTask?.deadline || ''
        };
    })
        .filter(row => row.total > 0)
        .sort((a, b) => {
            const aTime = a.nearestDeadline ? new Date(a.nearestDeadline).getTime() : Number.MAX_SAFE_INTEGER;
            const bTime = b.nearestDeadline ? new Date(b.nearestDeadline).getTime() : Number.MAX_SAFE_INTEGER;
            return aTime - bTime || b.active - a.active;
        });

    const currentPic = members.find(member => member.id === currentPicId);
    const todayLabel = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="w-full max-w-[1500px] animate-fade-in">
            <div className="relative overflow-hidden rounded-3xl mb-5 p-5 sm:p-6 shadow-xl shadow-sky-200/40 text-white" style={{ backgroundImage: 'linear-gradient(120deg, #7c3aed 0%, #c026d3 45%, #0284c7 100%)' }}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-white/70">{todayLabel}</div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">{getGreeting()}, {currentPic?.name || 'Tim'}! 👋</h2>
                        <p className="text-sm text-white/80 mt-1">Ruang kerja ringkas untuk deadline, project, dan shortcut Markom.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <WeatherWidget />
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">Ringkasan Task</h2>
                <select
                    value={dashboardPicFilter}
                    onChange={(e) => setDashboardPicFilter(e.target.value)}
                    className="border border-white/80 rounded-2xl px-3 py-2 text-sm bg-white/75 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 min-w-[180px] shadow-sm"
                >
                    <option value="all">Semua PIC</option>
                    <option value="none">{ALL_MARKOM_LABEL}</option>
                    {members.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                </select>
            </div>

            <TaskSummary stats={dashboardStats} />
            <QuickAddTask projects={projects} members={members} defaultPicId={currentPicId} onAddTask={onQuickAddTask} />

            <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_360px] gap-5">
                <div className="min-w-0 space-y-5">
                    <DashboardTaskList
                        title="Fokus Hari Ini"
                        tasks={focusTasks}
                        projects={projects}
                        members={members}
                        tone="orange"
                        emptyText="Tidak ada deadline minggu ini."
                        onEdit={onEdit}
                    />
                    <DashboardProjectMonthPanel rows={projectMonthRows} />
                </div>

                <div className="2xl:sticky 2xl:top-4 h-fit space-y-5">
                    <FavoriteShortcuts shortcuts={shortcuts} />
                    <MiniDashboardCalendar tasks={filteredTasks} projects={projects} onEdit={onEdit} />
                </div>
            </div>
        </div>
    );
};

const MarkomCalendar = ({ tasks, projects, members, currentPicId = '', onEdit, onCreateTask, onToggleProjectCalendar }) => {
    const [currentMonth, setCurrentMonth] = useState(() => {
        const date = new Date();
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        return date;
    });
    // Tampilan kalender selalu default semua PIC. Login PIC hanya dipakai untuk default PIC saat menambah task.
    const [picFilter, setPicFilter] = useState('all');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const leadingDays = (monthStart.getDay() + 6) % 7;
    const calendarStart = addDays(monthStart, -leadingDays);
    const calendarDays = Array.from({ length: 42 }, (_, index) => addDays(calendarStart, index));
    const visibleProjectIds = projects.filter(project => project.showInCalendar).map(project => project.id);

    const filteredTasks = tasks.filter(task => {
        if (!task.deadline) return false;
        if (!visibleProjectIds.includes(task.projectId)) return false;
        if (picFilter === 'none') return !task.picId;
        if (picFilter !== 'all' && task.picId !== picFilter) return false;
        return true;
    });

    const tasksByDate = filteredTasks.reduce((groups, task) => {
        const dueDate = getDateOnly(task.deadline);
        if (!dueDate) return groups;
        const key = toDateInputValue(dueDate);
        groups[key] = groups[key] || [];
        groups[key].push(task);
        return groups;
    }, {});

    Object.keys(tasksByDate).forEach(key => {
        tasksByDate[key].sort((a, b) => {
            if (a.status === 'Done' && b.status !== 'Done') return 1;
            if (a.status !== 'Done' && b.status === 'Done') return -1;
            const priorityRank = { High: 3, Medium: 2, Low: 1 };
            return (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
        });
    });

    const monthTasks = filteredTasks.filter(task => {
        const dueDate = getDateOnly(task.deadline);
        return dueDate && dueDate >= monthStart && dueDate <= monthEnd;
    });

    const monthStats = monthTasks.reduce((stats, task) => {
        const deadlineState = getDeadlineState(task.deadline, task.status);
        return {
            total: stats.total + 1,
            done: stats.done + (task.status === 'Done' ? 1 : 0),
            overdue: stats.overdue + (deadlineState === 'overdue' ? 1 : 0),
            today: stats.today + (deadlineState === 'today' ? 1 : 0)
        };
    }, { total: 0, done: 0, overdue: 0, today: 0 });

    const moveMonth = (offset) => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const goToday = () => {
        const date = new Date();
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        setCurrentMonth(date);
    };

    const weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const monthLabel = currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    return (
        <div className="max-w-[1500px] animate-fade-in">
            <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 mb-5">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">Kalender Markom</h2>
                    <p className="text-sm text-slate-500 mt-1">Kalender deadline berdasarkan project yang dicentang.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={picFilter}
                        onChange={(e) => setPicFilter(e.target.value)}
                        className="border border-white/80 rounded-2xl px-3 py-2 text-sm bg-white/75 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 shadow-sm"
                    >
                        <option value="all">Semua PIC</option>
                        <option value="none">{ALL_MARKOM_LABEL}</option>
                        {members.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="border border-white/70 rounded-3xl bg-white/75 p-3 mb-4 shadow-xl shadow-slate-200/40 backdrop-blur">
                <div className="text-sm font-semibold mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg tint-lavender">Filter Project Kalender</div>
                <div className="flex flex-wrap gap-2 mt-1">
                    {projects.map(project => (
                        <label
                            key={project.id}
                            className={`inline-flex items-center gap-2 border rounded-2xl px-3 py-2 text-sm cursor-pointer transition-colors ${project.showInCalendar ? 'bg-white border-white text-slate-950 shadow-sm' : 'bg-white/40 border-white/60 text-slate-500'}`}
                        >
                            <input
                                type="checkbox"
                                checked={!!project.showInCalendar}
                                onChange={(e) => onToggleProjectCalendar(project.id, e.target.checked)}
                                className="rounded border-gray-300"
                            />
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color || '#2563eb' }}></span>
                            <span>{project.name}</span>
                        </label>
                    ))}
                </div>
                <div className="text-xs text-gray-500 mt-2">Default awal hanya Promo dan Event yang aktif. Project lain bisa dicentang di sini atau dari sidebar.</div>
            </div>

            <TaskSummary stats={monthStats} />

            <div className="border border-white/70 rounded-3xl bg-white/75 overflow-hidden shadow-xl shadow-slate-200/40 backdrop-blur">
                <div className="px-4 py-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <button onClick={() => moveMonth(-1)} className="w-9 h-9 rounded-2xl border border-white/80 bg-white/70 hover:bg-white text-slate-600 shadow-sm">
                            <i className="fa-solid fa-chevron-left text-xs"></i>
                        </button>
                        <div className="min-w-[180px] text-center font-semibold text-gray-900 capitalize">{monthLabel}</div>
                        <button onClick={() => moveMonth(1)} className="w-9 h-9 rounded-2xl border border-white/80 bg-white/70 hover:bg-white text-slate-600 shadow-sm">
                            <i className="fa-solid fa-chevron-right text-xs"></i>
                        </button>
                    </div>
                    <button onClick={goToday} className="border border-white/80 bg-white/70 rounded-2xl px-3 py-2 text-sm text-slate-700 hover:bg-white shadow-sm">
                        Bulan Ini
                    </button>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <div className="min-w-[980px]">
                        <div className="grid grid-cols-7 border-b border-slate-100 bg-white/55">
                            {weekDays.map(day => (
                                <div key={day} className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">{day}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7">
                            {calendarDays.map(day => {
                                const dateKey = toDateInputValue(day);
                                const dayTasks = tasksByDate[dateKey] || [];
                                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                                const isToday = day.getTime() === today.getTime();

                                return (
                                    <div key={dateKey} className={`min-h-[132px] border-r border-b border-slate-100 p-2 ${isCurrentMonth ? 'bg-white/70' : 'bg-white/35'} ${isToday ? 'ring-2 ring-orange-300 ring-inset' : ''}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-xs font-semibold ${isToday ? 'bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : isCurrentMonth ? 'text-gray-800' : 'text-gray-400'}`}>
                                                {day.getDate()}
                                            </span>
                                            <button
                                                onClick={() => onCreateTask(dateKey)}
                                                className="w-6 h-6 rounded-md text-gray-300 hover:text-gray-800 hover:bg-gray-100"
                                                title={`Tambah task ${formatDeadline(dateKey)}`}
                                            >
                                                <i className="fa-solid fa-plus text-xs"></i>
                                            </button>
                                        </div>

                                        <div className="space-y-1">
                                            {dayTasks.slice(0, 3).map(task => {
                                                const project = projects.find(p => p.id === task.projectId);
                                                const member = members.find(m => m.id === task.picId);
                                                const projectColor = project?.color || '#2563eb';
                                                const taskClass = task.status === 'Done' ? 'line-through opacity-70' : '';

                                                return (
                                                    <button
                                                        key={task.id}
                                                        onClick={() => onEdit(task)}
                                                        className={`w-full text-left border rounded px-2 py-1 hover:border-gray-300 transition-colors ${taskClass}`}
                                                        style={{
                                                            backgroundColor: hexToRgba(projectColor, 0.12),
                                                            borderColor: hexToRgba(projectColor, 0.35),
                                                            color: projectColor,
                                                            borderLeftWidth: '3px'
                                                        }}
                                                        title={`${task.title} - ${project?.name || 'Tanpa Project'} - ${member?.name || ALL_MARKOM_LABEL}`}
                                                    >
                                                        <div className="text-[11px] font-medium truncate">{task.title}</div>
                                                        <div className="text-[10px] opacity-80 truncate">{project?.name || 'Tanpa Project'} · {member?.name || ALL_MARKOM_LABEL}</div>
                                                    </button>
                                                );
                                            })}
                                            {dayTasks.length > 3 && (
                                                <div className="text-[11px] text-gray-400 px-1">+{dayTasks.length - 3} task lagi</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TaskSummary = ({ stats }) => {
    const items = [
        { label: 'Total', value: stats.total, tint: 'tint-lavender', icon: 'fa-solid fa-list-check' },
        { label: 'Selesai', value: stats.done, tint: 'tint-mint', icon: 'fa-solid fa-circle-check' },
        { label: 'Overdue', value: stats.overdue, tint: 'tint-pink', icon: 'fa-solid fa-triangle-exclamation' },
        { label: 'Hari Ini', value: stats.today, tint: 'tint-peach', icon: 'fa-solid fa-clock' }
    ];

    return (
        <div className="w-full flex flex-wrap items-center gap-2 mb-4">
            {items.map(item => (
                <div key={item.label} className={`inline-flex items-center gap-2.5 rounded-2xl px-3 py-2 text-sm shadow-sm ${item.tint}`}>
                    <span className="w-6 h-6 rounded-lg bg-white/60 flex items-center justify-center text-xs">
                        <i className={item.icon}></i>
                    </span>
                    <span className="opacity-80">{item.label}</span>
                    <span className="font-bold">{item.value}</span>
                </div>
            ))}
        </div>
    );
};

const TaskControls = ({
    members,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    picFilter,
    setPicFilter,
    sortMode,
    setSortMode,
    onReset
}) => {
    return (
        <div className="w-full mb-4 border border-white/70 rounded-3xl bg-white/60 p-3 shadow-lg shadow-slate-200/30 backdrop-blur">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative w-full sm:flex-1 sm:min-w-[220px]">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari task..."
                        className="w-full border border-white/80 rounded-2xl bg-white/75 pl-8 pr-3 py-2 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                    />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-auto border border-white/80 rounded-2xl px-3 py-2 text-sm bg-white/75 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100">
                    <option value="all">Status</option>
                    {COLUMNS.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
                <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-full sm:w-auto border border-white/80 rounded-2xl px-3 py-2 text-sm bg-white/75 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100">
                    <option value="all">Prioritas</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
                <select value={picFilter} onChange={(e) => setPicFilter(e.target.value)} className="w-full sm:w-auto border border-white/80 rounded-2xl px-3 py-2 text-sm bg-white/75 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100">
                    <option value="all">PIC</option>
                    <option value="none">{ALL_MARKOM_LABEL}</option>
                    {members.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                </select>
                <select value={sortMode} onChange={(e) => setSortMode(e.target.value)} className="w-full sm:w-auto border border-white/80 rounded-2xl px-3 py-2 text-sm bg-white/75 outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100">
                    <option value="deadline_asc">Deadline Terdekat</option>
                    <option value="deadline_desc">Deadline Terjauh</option>
                    <option value="priority_desc">Prioritas Tertinggi</option>
                    <option value="title_asc">Nama A-Z</option>
                </select>
                <button onClick={onReset} className="w-full sm:w-auto border border-white/80 rounded-2xl bg-white/50 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-white">
                    Reset
                </button>
            </div>
        </div>
    );
};

const NotesPage = ({ notes, members, currentPicId = '', onAddNote, onUpdateNote, onDeleteNote, onCreateTaskFromMeeting }) => {
    const [activeTab, setActiveTab] = useState('memo');
    const [editingId, setEditingId] = useState(null);
    const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [meetingTitleDraft, setMeetingTitleDraft] = useState('');
    const [selectedMeetingTitle, setSelectedMeetingTitle] = useState('');
    const [activeMeetingTitle, setActiveMeetingTitle] = useState('');
    const [memoForm, setMemoForm] = useState({ title: '', content: '' });
    const [meetingForm, setMeetingForm] = useState({ title: '', issue: '', decision: '', picId: currentPicId || '', deadline: '' });

    useEffect(() => {
        if (!editingId) {
            setMeetingForm(prev => ({ ...prev, picId: prev.picId || currentPicId || '' }));
        }
    }, [currentPicId, editingId]);

    const memos = notes.filter(note => note.type === 'memo');
    const meetings = notes.filter(note => note.type === 'meeting');
    const groupedMeetings = Object.values(meetings.reduce((groups, meeting) => {
        const title = (meeting.title || 'Meeting Tanpa Judul').trim() || 'Meeting Tanpa Judul';
        if (!groups[title]) groups[title] = { title, items: [] };
        if (meeting.content !== '__meeting_card__') groups[title].items.push(meeting);
        return groups;
    }, {}));
    const selectedMeeting = groupedMeetings.find(group => group.title === selectedMeetingTitle);

    const resetForms = () => {
        setEditingId(null);
        setIsMemoModalOpen(false);
        setIsMeetingModalOpen(false);
        setMeetingTitleDraft('');
        setActiveMeetingTitle('');
        setMemoForm({ title: '', content: '' });
        setMeetingForm({ title: '', issue: '', decision: '', picId: currentPicId || '', deadline: '' });
    };

    const submitMemo = async (e) => {
        e.preventDefault();
        if (!memoForm.title.trim() && !memoForm.content.trim()) return;

        const payload = {
            type: 'memo',
            title: memoForm.title.trim(),
            content: memoForm.content.trim()
        };

        const ok = editingId ? await onUpdateNote(editingId, payload) : await onAddNote(payload);
        if (ok) resetForms();
    };

    const openNewMemo = () => {
        setEditingId(null);
        setMemoForm({ title: '', content: '' });
        setIsMemoModalOpen(true);
    };

    const submitMeetingCard = async (e) => {
        e.preventDefault();
        const title = meetingTitleDraft.trim();
        if (!title) return;

        const ok = await onAddNote({
            type: 'meeting',
            title,
            content: '__meeting_card__',
            issue: '',
            decision: '',
            picId: '',
            deadline: ''
        });
        if (ok) {
            resetForms();
            setSelectedMeetingTitle(title);
        }
    };

    const submitMeetingRow = async (e) => {
        e.preventDefault();
        if (!meetingForm.issue.trim()) return;

        const payload = {
            type: 'meeting',
            title: meetingForm.title.trim() || activeMeetingTitle || 'Meeting Internal Markom',
            issue: meetingForm.issue.trim(),
            decision: meetingForm.decision.trim(),
            picId: meetingForm.picId,
            deadline: meetingForm.deadline,
            isDone: editingId ? notes.find(note => note.id === editingId)?.isDone || false : false
        };

        const ok = editingId ? await onUpdateNote(editingId, payload) : await onAddNote(payload);
        if (ok) resetForms();
    };

    const startEditMemo = (memo) => {
        setActiveTab('memo');
        setEditingId(memo.id);
        setMemoForm({ title: memo.title || '', content: memo.content || '' });
        setIsMemoModalOpen(true);
    };

    const openMeetingCardModal = () => {
        setEditingId(null);
        setMeetingTitleDraft('');
        setIsMeetingModalOpen(true);
    };

    const openMeetingRowForm = (title) => {
        setEditingId(null);
        setActiveMeetingTitle(title);
        setMeetingForm({ title, issue: '', decision: '', picId: currentPicId || '', deadline: '' });
    };

    const openMeetingDetail = (title) => {
        resetForms();
        setSelectedMeetingTitle(title);
    };

    const backToMeetingList = () => {
        resetForms();
        setSelectedMeetingTitle('');
    };

    const startEditMeeting = (meeting) => {
        setActiveTab('meeting');
        setEditingId(meeting.id);
        setSelectedMeetingTitle(meeting.title || 'Meeting Tanpa Judul');
        setActiveMeetingTitle(meeting.title || 'Meeting Tanpa Judul');
        setMeetingForm({
            title: meeting.title || '',
            issue: meeting.issue || '',
            decision: meeting.decision || '',
            picId: meeting.picId || '',
            deadline: meeting.deadline || ''
        });
    };

    const meetingPic = (picId) => members.find(member => member.id === picId);

    const handleToggleMeetingDone = async (meeting) => {
        await onUpdateNote(meeting.id, {
            type: 'meeting',
            title: meeting.title || 'Meeting Tanpa Judul',
            content: meeting.content || '',
            issue: meeting.issue || '',
            decision: meeting.decision || '',
            picId: meeting.picId || '',
            deadline: meeting.deadline || '',
            isDone: !meeting.isDone
        });
    };

    const downloadMeetingExcel = () => {
        if (!selectedMeeting) return;

        const escapeHtml = (value) => String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        const rows = selectedMeeting.items.map((meeting, index) => {
            const pic = meetingPic(meeting.picId);
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${escapeHtml(meeting.issue)}</td>
                    <td>${escapeHtml(meeting.decision)}</td>
                    <td>${escapeHtml(pic?.name || ALL_MARKOM_LABEL)}</td>
                    <td>${escapeHtml(formatDeadline(meeting.deadline) || '')}</td>
                    <td>${meeting.isDone ? 'Tuntas' : 'Belum Tuntas'}</td>
                </tr>
            `;
        }).join('');

        const html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                <head><meta charset="UTF-8"></head>
                <body>
                    <table border="1">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Issue</th>
                                <th>Keputusan</th>
                                <th>PIC</th>
                                <th>Deadline</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </body>
            </html>
        `;

        const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeTitle = selectedMeeting.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'minute-of-meeting';
        link.href = url;
        link.download = `${safeTitle}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Notes</h2>
                    <p className="text-sm text-slate-500 mt-1">Simpan memo cepat dan minute of meeting tim Markom.</p>
                </div>
                <div className="inline-flex w-fit rounded-2xl border border-white/70 bg-white/60 p-1 shadow-sm">
                    <button
                        onClick={() => { setActiveTab('memo'); resetForms(); setSelectedMeetingTitle(''); }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'memo' ? 'tint-peach-solid' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Memo
                    </button>
                    <button
                        onClick={() => { setActiveTab('meeting'); resetForms(); setSelectedMeetingTitle(''); }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'meeting' ? 'tint-peach-solid' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Minute of Meeting
                    </button>
                </div>
            </div>

            {activeTab === 'memo' && (
                <>
                    <div className="mb-5">
                        <button
                            onClick={openNewMemo}
                            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-300/40 hover:bg-slate-800"
                        >
                            <i className="fa-solid fa-plus text-xs"></i>
                            Tambah Memo
                        </button>
                    </div>

                    {isMemoModalOpen && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/35 p-4 animate-fade-in">
                            <form onSubmit={submitMemo} className="w-full max-w-xl overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-2xl shadow-slate-900/20">
                                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <i className="fa-regular fa-note-sticky text-slate-400"></i>
                                        {editingId ? 'Edit Memo' : 'Memo Baru'}
                                    </div>
                                    <button type="button" onClick={resetForms} className="w-8 h-8 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-900">
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </div>
                                <div className="p-5">
                                    <input
                                        type="text"
                                        value={memoForm.title}
                                        onChange={(e) => setMemoForm(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="Judul memo..."
                                        autoFocus
                                        className="w-full bg-transparent text-2xl font-bold outline-none placeholder:text-slate-300"
                                    />
                                    <textarea
                                        value={memoForm.content}
                                        onChange={(e) => setMemoForm(prev => ({ ...prev, content: e.target.value }))}
                                        placeholder="Tulis isi memo..."
                                        rows="7"
                                        className="mt-4 w-full resize-none bg-transparent text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-300"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
                                    <button type="button" onClick={resetForms} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
                                        Batal
                                    </button>
                                    <button type="submit" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                                        {editingId ? 'Update Memo' : 'Simpan Memo'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {memos.map(memo => (
                            <div
                                key={memo.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => startEditMemo(memo)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        startEditMemo(memo);
                                    }
                                }}
                                className="rounded-3xl border border-white/70 bg-white/75 p-4 text-left shadow-lg shadow-slate-200/30 backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-300"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="font-semibold text-slate-900 break-words">{memo.title || 'Tanpa Judul'}</h3>
                                    <div className="flex shrink-0 gap-1">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startEditMemo(memo);
                                            }}
                                            className="w-8 h-8 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                                            title="Edit memo"
                                        >
                                            <i className="fa-regular fa-pen-to-square text-xs"></i>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteNote(memo.id);
                                            }}
                                            className="w-8 h-8 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600"
                                            title="Hapus memo"
                                        >
                                            <i className="fa-regular fa-trash-can text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {memos.length === 0 && (
                            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/45 p-8 text-center text-sm text-slate-400 md:col-span-2 xl:col-span-3">
                                Belum ada memo.
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'meeting' && (
                <>
                    {isMeetingModalOpen && (
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/35 p-4 animate-fade-in">
                            <form onSubmit={submitMeetingCard} className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-2xl shadow-slate-900/20">
                                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <i className="fa-regular fa-clipboard text-slate-400"></i>
                                        Meeting Baru
                                    </div>
                                    <button type="button" onClick={resetForms} className="w-8 h-8 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-900">
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </div>
                                <div className="p-5">
                                    <input
                                        type="text"
                                        value={meetingTitleDraft}
                                        onChange={(e) => setMeetingTitleDraft(e.target.value)}
                                        placeholder="Contoh: Meeting Internal Markom"
                                        autoFocus
                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
                                    <button type="button" onClick={resetForms} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
                                        Batal
                                    </button>
                                    <button type="submit" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                                        Buat Meeting
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {!selectedMeeting && (
                        <>
                            <div className="mb-5 flex items-center justify-between gap-3">
                                <button
                                    onClick={openMeetingCardModal}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-300/40 hover:bg-slate-800"
                                >
                                    <i className="fa-solid fa-plus text-xs"></i>
                                    Tambah Meeting
                                </button>
                                <span className="text-xs text-slate-400">{groupedMeetings.length} kartu meeting</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {groupedMeetings.map(group => {
                                    const latestItem = group.items[0];
                                    return (
                                        <button
                                            key={group.title}
                                            onClick={() => openMeetingDetail(group.title)}
                                            className="group rounded-3xl border border-white/70 bg-white/75 p-5 text-left shadow-lg shadow-slate-200/30 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <h3 className="truncate text-base font-semibold text-slate-900">{group.title}</h3>
                                                    <p className="mt-1 text-xs text-slate-400">{group.items.length} catatan meeting</p>
                                                </div>
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white transition-transform group-hover:translate-x-1">
                                                    <i className="fa-solid fa-arrow-right text-xs"></i>
                                                </span>
                                            </div>
                                            <div className="mt-5 rounded-2xl bg-slate-50/80 p-3 text-sm text-slate-500">
                                                {latestItem ? (
                                                    <p className="max-h-10 overflow-hidden leading-5">{latestItem.issue || latestItem.decision || 'Catatan meeting tersedia.'}</p>
                                                ) : (
                                                    <p>Belum ada baris pembahasan.</p>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                                {groupedMeetings.length === 0 && (
                                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white/45 p-8 text-center text-sm text-slate-400 md:col-span-2 xl:col-span-3">
                                        Belum ada minute of meeting.
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {selectedMeeting && (
                        <div className="space-y-4">
                            <div className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-lg shadow-slate-200/30">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex items-start gap-3">
                                        <button
                                            onClick={backToMeetingList}
                                            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 hover:text-slate-950"
                                            title="Kembali ke daftar meeting"
                                        >
                                            <i className="fa-solid fa-arrow-left text-xs"></i>
                                        </button>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Detail Meeting</p>
                                            <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{selectedMeeting.title}</h3>
                                            <p className="mt-1 text-sm text-slate-500">{selectedMeeting.items.length} baris pembahasan</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <button
                                            type="button"
                                            onClick={downloadMeetingExcel}
                                            disabled={!selectedMeeting.items.length}
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <i className="fa-regular fa-file-excel text-xs"></i>
                                            Download Excel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openMeetingRowForm(selectedMeeting.title)}
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                                        >
                                            <i className="fa-solid fa-plus text-xs"></i>
                                            Tambah Baris Pembahasan
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {activeMeetingTitle === selectedMeeting.title && (
                                <form onSubmit={submitMeetingRow} className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-lg shadow-slate-200/30">
                                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                        <textarea
                                            value={meetingForm.issue}
                                            onChange={(e) => setMeetingForm(prev => ({ ...prev, issue: e.target.value }))}
                                            placeholder="Issue..."
                                            rows="4"
                                            className="rounded-2xl border border-white/80 bg-white px-4 py-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                                        />
                                        <textarea
                                            value={meetingForm.decision}
                                            onChange={(e) => setMeetingForm(prev => ({ ...prev, decision: e.target.value }))}
                                            placeholder="Keputusan..."
                                            rows="4"
                                            className="rounded-2xl border border-white/80 bg-white px-4 py-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                                        />
                                    </div>
                                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
                                        <select
                                            value={meetingForm.picId}
                                            onChange={(e) => setMeetingForm(prev => ({ ...prev, picId: e.target.value }))}
                                            className="rounded-2xl border border-white/80 bg-white px-4 py-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                                        >
                                            <option value="">{ALL_MARKOM_LABEL}</option>
                                            {members.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                                        </select>
                                        <input
                                            type="date"
                                            value={meetingForm.deadline}
                                            onChange={(e) => setMeetingForm(prev => ({ ...prev, deadline: e.target.value }))}
                                            className="rounded-2xl border border-white/80 bg-white px-4 py-3 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                                        />
                                        <div className="flex gap-2">
                                            <button type="button" onClick={resetForms} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900">
                                                Batal
                                            </button>
                                            <button type="submit" className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 whitespace-nowrap">
                                                {editingId ? 'Update Baris' : 'Simpan Baris'}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}

                            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/75 shadow-lg shadow-slate-200/30">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[980px] text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white/60 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                <th className="p-3 font-medium">Issue</th>
                                                <th className="p-3 font-medium">Keputusan</th>
                                                <th className="p-3 font-medium w-44">PIC</th>
                                                <th className="p-3 font-medium w-36">Deadline</th>
                                                <th className="p-3 font-medium w-24 text-center">Tuntas</th>
                                                <th className="p-3 font-medium w-48 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white/45">
                                            {selectedMeeting.items.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" className="p-8 text-center text-sm text-slate-400">
                                                        Belum ada baris pembahasan. Klik Tambah Baris Pembahasan untuk mulai mencatat.
                                                    </td>
                                                </tr>
                                            )}
                                            {selectedMeeting.items.map(meeting => {
                                                const pic = meetingPic(meeting.picId);
                                                return (
                                                    <tr key={meeting.id} className={`align-top ${meeting.isDone ? 'bg-slate-50/70 opacity-70' : ''}`}>
                                                        <td className={`p-3 text-sm whitespace-pre-wrap ${meeting.isDone ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{meeting.issue || '-'}</td>
                                                        <td className={`p-3 text-sm whitespace-pre-wrap ${meeting.isDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{meeting.decision || '-'}</td>
                                                        <td className="p-3">
                                                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                                                {pic ? <span className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ backgroundColor: pic.color }}>{getInitials(pic.name)}</span> : null}
                                                                <span>{pic?.name || ALL_MARKOM_LABEL}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-sm text-slate-700">{formatDeadline(meeting.deadline) || '-'}</td>
                                                        <td className="p-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!meeting.isDone}
                                                                onChange={() => handleToggleMeetingDone(meeting)}
                                                                className="h-4 w-4 rounded border-slate-300 accent-slate-950"
                                                                title="Tandai tuntas"
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => onCreateTaskFromMeeting(meeting)} className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap">
                                                                    Buat Task
                                                                </button>
                                                                <button onClick={() => startEditMeeting(meeting)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900">
                                                                    Edit
                                                                </button>
                                                                <button onClick={() => onDeleteNote(meeting.id)} className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100">
                                                                    Hapus
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

const ShortcutLauncher = ({ shortcuts, onAddShortcut, onDeleteShortcut, onToggleShortcutFavorite }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [form, setForm] = useState({ title: '', url: '', icon: '', color: '#2563eb', isFavorite: true });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.url.trim()) return;

        const cleanUrl = form.url.trim().startsWith('http') ? form.url.trim() : `https://${form.url.trim()}`;
        await onAddShortcut({
            title: form.title.trim(),
            url: cleanUrl,
            icon: (form.icon.trim() || getInitials(form.title)).substring(0, 3).toUpperCase(),
            color: form.color,
            isFavorite: form.isFavorite
        });
        setForm({ title: '', url: '', icon: '', color: '#2563eb', isFavorite: true });
        setIsAdding(false);
    };

    const launcherPanel = typeof document !== 'undefined' && isOpen ? createPortal(
        <div className="fixed inset-0 z-[2147483647]">
            <button
                type="button"
                aria-label="Tutup shortcut"
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 cursor-default bg-transparent"
            />
            <div className="absolute right-4 top-4 md:right-6 md:top-6 w-[min(380px,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] bg-white border border-white/90 rounded-[28px] shadow-2xl shadow-slate-900/25 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 tint-sky">
                    <div>
                        <div className="text-sm font-semibold">Markom Tools</div>
                        <div className="text-xs opacity-70">Portal dan bookmark kerja cepat</div>
                    </div>
                    <button
                        onClick={() => setIsAdding(prev => !prev)}
                        className="tint-sky-solid px-3 py-1.5 rounded-2xl text-xs font-medium hover:opacity-90"
                    >
                        {isAdding ? 'Tutup' : 'Tambah'}
                    </button>
                </div>

                {isAdding && (
                    <form onSubmit={handleSubmit} className="p-3 border-b border-slate-100 bg-slate-50/70 space-y-2">
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Nama shortcut"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-gray-700 focus:ring-1 focus:ring-gray-700 bg-white"
                        />
                        <input
                            type="text"
                            value={form.url}
                            onChange={(e) => setForm(prev => ({ ...prev, url: e.target.value }))}
                            placeholder="URL, contoh: https://..."
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-gray-700 focus:ring-1 focus:ring-gray-700 bg-white"
                        />
                        <div className="flex gap-2">
                            <input
                                type="text"
                                maxLength="3"
                                value={form.icon}
                                onChange={(e) => setForm(prev => ({ ...prev, icon: e.target.value }))}
                                placeholder="Ikon"
                                className="w-20 border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-gray-700 focus:ring-1 focus:ring-gray-700 bg-white"
                            />
                            <input
                                type="color"
                                value={form.color}
                                onChange={(e) => setForm(prev => ({ ...prev, color: e.target.value }))}
                                className="w-12 h-10 border border-gray-300 rounded-md bg-white p-1"
                                title="Warna ikon"
                            />
                            <button type="submit" className="flex-1 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800">
                                Simpan Shortcut
                            </button>
                        </div>
                        <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                            <input
                                type="checkbox"
                                checked={form.isFavorite}
                                onChange={(e) => setForm(prev => ({ ...prev, isFavorite: e.target.checked }))}
                                className="rounded border-gray-300"
                            />
                            Tampilkan di Dashboard
                        </label>
                    </form>
                )}

                <div className="p-4 grid grid-cols-3 gap-y-5 gap-x-3 overflow-y-auto max-h-[calc(100dvh-11rem)] custom-scrollbar">
                    {shortcuts.map(shortcut => (
                        <div key={shortcut.id} className="relative group flex flex-col items-center text-center">
                            <a
                                href={shortcut.url}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full flex flex-col items-center rounded-xl p-2 hover:bg-gray-50 transition-colors"
                                title={shortcut.title}
                            >
                                <div className="w-11 h-11 rounded-xl text-white flex items-center justify-center text-sm font-bold shadow-sm" style={{ backgroundColor: shortcut.color || '#2563eb' }}>
                                    {(shortcut.icon || getInitials(shortcut.title)).substring(0, 3).toUpperCase()}
                                </div>
                                <span className="mt-2 text-xs text-gray-800 w-full truncate">{shortcut.title}</span>
                            </a>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onToggleShortcutFavorite(shortcut.id);
                                }}
                                className={`absolute top-0 left-1 w-6 h-6 rounded-full bg-white border border-gray-200 transition-colors ${shortcut.isFavorite ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'}`}
                                title={shortcut.isFavorite ? 'Hapus dari favorit dashboard' : 'Jadikan favorit dashboard'}
                            >
                                <i className={`${shortcut.isFavorite ? 'fa-solid' : 'fa-regular'} fa-star text-xs`}></i>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onDeleteShortcut(shortcut.id);
                                }}
                                className="absolute top-0 right-1 w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Hapus shortcut"
                            >
                                <i className="fa-solid fa-xmark text-xs"></i>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className="relative z-[10000]">
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'tint-sky' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                title="Shortcut Markom"
            >
                <i className="fa-solid fa-grip text-lg"></i>
            </button>
            {launcherPanel}
        </div>
    );
};

const PIN_UNLOCK_KEY = 'markom_tools_pin_unlock_until';
const CURRENT_PIC_KEY = 'markom_tools_current_pic_id';
const PIN_UNLOCK_DURATION = 1000 * 60 * 60 * 12;

const PinGate = ({ members = [], selectedPicId = '', onPicChange, onUnlock }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const cleanPin = pin.trim();
        if (!selectedPicId) {
            setError('Pilih PIC terlebih dahulu.');
            return;
        }
        if (!cleanPin) {
            setError('Masukkan PIN akses.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/verify-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: cleanPin })
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok || !result.ok) {
                setError(result.message || 'PIN salah.');
                setPin('');
                return;
            }

            localStorage.setItem(PIN_UNLOCK_KEY, String(Date.now() + PIN_UNLOCK_DURATION));
            localStorage.setItem(CURRENT_PIC_KEY, selectedPicId);
            onUnlock(selectedPicId);
        } catch (err) {
            console.error('PIN verification error:', err);
            setError('Gagal mengecek PIN. Pastikan file API verify-pin sudah dipasang.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[linear-gradient(135deg,#ede9fe_0%,#e0f2fe_35%,#fce7f3_65%,#dbeafe_100%)] p-4 font-sans text-slate-900 flex items-center justify-center">
            <div className="w-full max-w-md rounded-[32px] border border-white/80 bg-white/70 p-6 shadow-2xl shadow-slate-300/60 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/20">
                        <img
                            src="https://pub-deabb4838f9345c095b0dbe31add5535.r2.dev/abs%204%20(1).png"
                            alt="Tim Markom"
                            className="w-full h-full object-contain p-1"
                        />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Private Tools</p>
                        <h1 className="text-xl font-bold tracking-tight text-slate-950">Tim Markom</h1>
                    </div>
                </div>

                <div className="mt-8">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Pilih PIC & Masukkan PIN</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">PIC yang dipilih akan menjadi default filter dashboard dan default penanggung jawab task baru.</p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <select
                        value={selectedPicId}
                        onChange={(e) => {
                            onPicChange?.(e.target.value);
                            setError('');
                        }}
                        className="w-full rounded-2xl border border-white/80 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                    >
                        <option value="">Pilih PIC</option>
                        {(members.length ? members : SEED_MEMBERS).map(member => (
                            <option key={member.id} value={member.id}>{member.name} ({member.position || 'Tim Markom'})</option>
                        ))}
                    </select>
                    <input
                        type="password"
                        inputMode="numeric"
                        autoComplete="current-password"
                        value={pin}
                        onChange={(e) => {
                            setPin(e.target.value);
                            setError('');
                        }}
                        placeholder="PIN akses"
                        autoFocus
                        className="w-full rounded-2xl border border-white/80 bg-white px-4 py-4 text-center text-2xl font-semibold tracking-[0.35em] text-slate-950 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                    />
                    {error && (
                        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                            {error}
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-2xl px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-300/50 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ backgroundImage: 'linear-gradient(120deg, #8b5cf6, #ec4899)' }}
                    >
                        {isSubmitting ? 'Memeriksa...' : 'Masuk'}
                    </button>
                </form>

                <p className="mt-5 text-center text-xs text-slate-400">Akses tersimpan selama 12 jam di browser ini.</p>
            </div>
        </div>
    );
};

export default function TaskManagerApp() {
    const [isMounted, setIsMounted] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [projects, setProjects] = useState([]);
    const [activeProject, setActiveProject] = useState('');
    const [members, setMembers] = useState([]);
    const [currentPicId, setCurrentPicId] = useState('');
    const [tasks, setTasks] = useState([]);
    const [shortcuts, setShortcuts] = useState([]);
    const [notes, setNotes] = useState([]);
    
    const [view, setView] = useState('dashboard'); 
    const [dialog, setDialog] = useState({ isOpen: false, type: '', message: '', onConfirm: null, defaultValue: '', required: false, placeholder: '' });
    const [editingTask, setEditingTask] = useState(null); 
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [picFilter, setPicFilter] = useState('all');
    const [sortMode, setSortMode] = useState('deadline_asc');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const unlockUntil = Number(localStorage.getItem(PIN_UNLOCK_KEY) || 0);
        const savedPicId = localStorage.getItem(CURRENT_PIC_KEY) || '';
        if (savedPicId) setCurrentPicId(savedPicId);

        const bootstrapLogin = async () => {
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .order('created_at', { ascending: true });

            const loginMembers = !error && data?.length ? data : SEED_MEMBERS;
            setMembers(loginMembers);

            if (!savedPicId && loginMembers[0]?.id) {
                setCurrentPicId(loginMembers[0].id);
                localStorage.setItem(CURRENT_PIC_KEY, loginMembers[0].id);
            }

            if (unlockUntil > Date.now()) {
                setIsUnlocked(true);
                return;
            }

            localStorage.removeItem(PIN_UNLOCK_KEY);
            setIsMounted(true);
        };

        bootstrapLogin();
    }, []);

    const handleCurrentPicChange = (picId) => {
        setCurrentPicId(picId);
        if (picId) localStorage.setItem(CURRENT_PIC_KEY, picId);
        else localStorage.removeItem(CURRENT_PIC_KEY);
    };

    // Load initial data from Supabase after the client has mounted.
    useEffect(() => {
        if (!isUnlocked) return;

        setIsMounted(false);

        const loadData = async () => {
            const [
                { data: projectsData, error: projectsError },
                { data: membersData, error: membersError },
                { data: tasksData, error: tasksError },
                { data: shortcutsData, error: shortcutsError },
                { data: notesData, error: notesError }
            ] = await Promise.all([
                supabase.from('projects').select('*').order('created_at', { ascending: true }),
                supabase.from('members').select('*').order('created_at', { ascending: true }),
                supabase.from('tasks').select('*').order('created_at', { ascending: true }),
                supabase.from('shortcuts').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
                supabase.from('notes').select('*').order('created_at', { ascending: false })
            ]);

            const firstError = projectsError || membersError || tasksError;
            if (firstError) {
                console.error('Supabase load error:', firstError);
                alert(`Gagal memuat data Supabase: ${firstError.message}`);
                setProjects(SEED_PROJECTS);
                setMembers(SEED_MEMBERS);
                setTasks(SEED_TASKS);
                setShortcuts(SEED_SHORTCUTS);
                setNotes(SEED_NOTES);
                setActiveProject(SEED_PROJECTS[0]?.id || '');
                setIsMounted(true);
                return;
            }

            const mappedProjects = (projectsData || []).map((project, index) => ({
                id: project.id,
                name: project.name,
                isPinned: project.is_pinned,
                color: project.color || getDefaultProjectColor(index),
                showInCalendar: project.show_in_calendar ?? isDefaultCalendarProject(project.name)
            }));

            const mappedTasks = (tasksData || []).map(task => ({
                id: task.id,
                projectId: task.project_id,
                title: task.title,
                status: task.status,
                priority: task.priority,
                deadline: task.deadline || '',
                picId: task.pic_id || '',
                todos: Array.isArray(task.todos)
                    ? task.todos.map(todo => ({ ...todo, picId: todo.picId || todo.pic_id || '' }))
                    : []
            }));

            const mappedMembers = membersData || [];
            const mappedShortcuts = (shortcutsData || []).map((shortcut, index) => ({
                id: shortcut.id,
                title: shortcut.title,
                url: shortcut.url,
                icon: shortcut.icon,
                color: shortcut.color,
                isFavorite: shortcut.is_favorite ?? index < 6
            }));
            const mappedNotes = (notesData || []).map(note => ({
                id: note.id,
                type: note.type,
                title: note.title || '',
                content: note.content || '',
                issue: note.issue || '',
                decision: note.decision || '',
                picId: note.pic_id || '',
                deadline: note.deadline || '',
                isDone: note.is_done || false,
                createdAt: note.created_at,
                updatedAt: note.updated_at
            }));

            if (shortcutsError) {
                console.warn('Supabase shortcuts load warning:', shortcutsError);
            }
            if (notesError) {
                console.warn('Supabase notes load warning:', notesError);
            }

            const nextMembers = mappedMembers.length ? mappedMembers : SEED_MEMBERS;
            setProjects(mappedProjects.length ? mappedProjects : SEED_PROJECTS);
            setMembers(nextMembers);
            setTasks(mappedTasks.length ? mappedTasks : SEED_TASKS);
            setShortcuts(mappedShortcuts.length ? mappedShortcuts : SEED_SHORTCUTS);
            setNotes(mappedNotes.length ? mappedNotes : SEED_NOTES);
            setActiveProject(mappedProjects[0]?.id || SEED_PROJECTS[0]?.id || '');
            setCurrentPicId(prev => {
                const savedPic = prev || localStorage.getItem(CURRENT_PIC_KEY) || '';
                if (savedPic && nextMembers.some(member => member.id === savedPic)) return savedPic;
                const fallbackPic = nextMembers[0]?.id || '';
                if (fallbackPic) localStorage.setItem(CURRENT_PIC_KEY, fallbackPic);
                return fallbackPic;
            });
            setIsMounted(true);
        };

        loadData();
    }, [isUnlocked]);

    if (!isMounted) return <div className="h-screen w-screen flex items-center justify-center bg-white text-gray-500">Memuat Workspace...</div>;

    if (!isUnlocked) return (
        <PinGate
            members={members.length ? members : SEED_MEMBERS}
            selectedPicId={currentPicId}
            onPicChange={handleCurrentPicChange}
            onUnlock={(picId) => {
                handleCurrentPicChange(picId);
                setIsUnlocked(true);
            }}
        />
    );

    const handleLockApp = () => {
        localStorage.removeItem(PIN_UNLOCK_KEY);
        setIsUnlocked(false);
        setIsMounted(true);
    };

    const openDialog = (config) => setDialog({ isOpen: true, ...config });
    const closeDialog = () => setDialog({ isOpen: false, type: '', message: '', onConfirm: null, defaultValue: '' });

    // Database Actions
    const handleAddProject = async () => {
        openDialog({
            type: 'prompt',
            message: 'Nama Project Baru:',
            placeholder: 'Contoh: Event Q3, Design System...',
            required: true,
            onConfirm: async (name) => {
                const newProject = {
                    id: Date.now().toString(),
                    name: name.trim(),
                    isPinned: false,
                    color: getDefaultProjectColor(projects.length),
                    showInCalendar: false
                };

                const { error } = await supabase.from('projects').insert({
                    id: newProject.id,
                    name: newProject.name,
                    is_pinned: newProject.isPinned,
                    color: newProject.color,
                    show_in_calendar: newProject.showInCalendar
                });

                if (error) {
                    console.error('Supabase project insert error:', error);
                    alert(`Gagal menambah project: ${error.message}. Jika error karena kolom color/show_in_calendar, jalankan project_calendar.sql di Supabase.`);
                    return;
                }

                setProjects(prev => [newProject, ...prev]);
                setActiveProject(newProject.id);
                setView('table');
            }
        });
    };

    const handleTogglePinProject = async (id, e) => {
        e.stopPropagation();
        const project = projects.find(p => p.id === id);
        if (!project) return;

        const nextPinned = !project.isPinned;
        const { error } = await supabase.from('projects').update({ is_pinned: nextPinned }).eq('id', id);

        if (error) {
            console.error('Supabase project pin error:', error);
            alert(`Gagal update pin project: ${error.message}`);
            return;
        }

        setProjects(prev => prev.map(p => p.id === id ? { ...p, isPinned: nextPinned } : p));
    };

    const handleUpdateProjectColor = async (id, color, e) => {
        e.stopPropagation();

        const { error } = await supabase
            .from('projects')
            .update({ color })
            .eq('id', id);

        if (error) {
            console.error('Supabase project color update error:', error);
            alert(`Gagal update warna project: ${error.message}. Jalankan project_colors.sql di Supabase jika kolom color belum ada.`);
            return;
        }

        setProjects(prev => prev.map(project => project.id === id ? { ...project, color } : project));
    };

    const handleToggleProjectCalendar = async (id, showInCalendar, e) => {
        if (e) e.stopPropagation();

        const { error } = await supabase
            .from('projects')
            .update({ show_in_calendar: showInCalendar })
            .eq('id', id);

        if (error) {
            console.error('Supabase project calendar update error:', error);
            alert(`Gagal update tampilan kalender: ${error.message}. Jalankan project_calendar.sql di Supabase jika kolom show_in_calendar belum ada.`);
            return;
        }

        setProjects(prev => prev.map(project => project.id === id ? { ...project, showInCalendar } : project));
    };

    const handleDeleteProject = async (id, e) => {
        e.stopPropagation();
        if (projects.length <= 1) {
            openDialog({ type: 'confirm', message: 'Tidak dapat menghapus project terakhir.', onConfirm: () => {} });
            return;
        }
        openDialog({
            type: 'confirm',
            message: 'Yakin ingin menghapus project ini beserta seluruh tugas di dalamnya secara permanen?',
            onConfirm: async () => {
                const { error } = await supabase.from('projects').delete().eq('id', id);

                if (error) {
                    console.error('Supabase project delete error:', error);
                    alert(`Gagal menghapus project: ${error.message}`);
                    return;
                }

                const newProjects = projects.filter(p => p.id !== id);
                setProjects(newProjects);
                setTasks(tasks.filter(t => t.projectId !== id));
                if (activeProject === id) setActiveProject(newProjects[0].id);
            }
        });
    };

    const handleAddTask = async (status = 'To Do') => {
        if (!activeProject) return;
        const newTaskTemplate = { 
            id: Date.now().toString(), 
            projectId: activeProject, 
            title: '', 
            status, 
            priority: 'Medium',
            deadline: '',
            picId: currentPicId || '',
            todos: [],
            isNew: true
        };
        setEditingTask(newTaskTemplate);
    };

    const handleAddTaskForDate = (deadline) => {
        const projectId = activeProject || projects[0]?.id || '';
        if (!projectId) {
            alert('Buat project terlebih dahulu sebelum menambah task kalender.');
            return;
        }

        setEditingTask({
            id: Date.now().toString(),
            projectId,
            title: '',
            status: 'To Do',
            priority: 'Medium',
            deadline,
            picId: currentPicId || '',
            todos: [],
            isNew: true
        });
    };

    const handleQuickAddTask = async (taskInput) => {
        if (!taskInput.title?.trim() || !taskInput.projectId) return false;

        const newTask = {
            id: Date.now().toString(),
            projectId: taskInput.projectId,
            title: taskInput.title.trim(),
            status: 'To Do',
            priority: taskInput.priority || 'Medium',
            deadline: taskInput.deadline || '',
            picId: taskInput.picId || currentPicId || '',
            todos: []
        };

        const { error } = await supabase.from('tasks').insert({
            id: newTask.id,
            project_id: newTask.projectId,
            title: newTask.title,
            status: newTask.status,
            priority: newTask.priority,
            deadline: newTask.deadline || null,
            pic_id: newTask.picId || null,
            todos: newTask.todos,
            updated_at: new Date().toISOString()
        });

        if (error) {
            console.error('Supabase quick task insert error:', error);
            alert(`Gagal menambah task cepat: ${error.message}`);
            return false;
        }

        setTasks(prev => [...prev, newTask]);
        return true;
    };

    const handleEditTask = (task) => setEditingTask(task);
    
    const handleSaveEditedTask = async (updatedTask) => {
        if (!updatedTask.title.trim() || !updatedTask.projectId) return false; 
        const normalizedTodos = (Array.isArray(updatedTask.todos) ? updatedTask.todos : [])
            .filter(todo => (todo.title || '').trim())
            .map(todo => ({
                id: todo.id || `td${Date.now().toString()}`,
                title: todo.title.trim(),
                done: !!todo.done,
                picId: todo.picId || todo.pic_id || ''
            }));

        const payload = {
            id: updatedTask.id,
            project_id: updatedTask.projectId,
            title: updatedTask.title.trim(),
            status: updatedTask.status || 'To Do',
            priority: updatedTask.priority || 'Medium',
            deadline: updatedTask.deadline || null,
            pic_id: updatedTask.picId || null,
            todos: normalizedTodos,
            updated_at: new Date().toISOString()
        };

        if (updatedTask.isNew) {
            const { isNew, ...taskToSave } = updatedTask;
            const { error } = await supabase.from('tasks').insert(payload);

            if (error) {
                console.error('Supabase task insert error:', error);
                alert(`Gagal menambah task: ${error.message}`);
                return false;
            }

            setTasks(prev => [...prev, { ...taskToSave, status: payload.status, priority: payload.priority, todos: normalizedTodos }]);
            return true;
        } else {
            const { isNew, ...taskToSave } = updatedTask;
            const { error } = await supabase.from('tasks').update(payload).eq('id', updatedTask.id);

            if (error) {
                console.error('Supabase task update error:', error);
                alert(`Gagal update task: ${error.message}`);
                return false;
            }

            setTasks(prev => prev.map(t => t.id === updatedTask.id ? { ...taskToSave, status: payload.status, priority: payload.priority, todos: normalizedTodos } : t));
            return true;
        }
    };

    const handleDeleteTask = async (id) => {
        openDialog({
            type: 'confirm',
            message: 'Apakah Anda yakin ingin menghapus tugas ini secara permanen?',
            onConfirm: async () => {
                const { error } = await supabase.from('tasks').delete().eq('id', id);

                if (error) {
                    console.error('Supabase task delete error:', error);
                    alert(`Gagal menghapus task: ${error.message}`);
                    return;
                }

                setTasks(prev => prev.filter(t => t.id !== id));
            }
        });
    };

    const handleUpdatePriority = async (id, priority) => {
        const { error } = await supabase
            .from('tasks')
            .update({ priority, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('Supabase priority update error:', error);
            alert(`Gagal update prioritas: ${error.message}`);
            return;
        }

        setTasks(prev => prev.map(t => t.id === id ? { ...t, priority } : t));
    };

    const handleUpdateStatus = async (id, status) => {
        const { error } = await supabase
            .from('tasks')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('Supabase status update error:', error);
            alert(`Gagal update status: ${error.message}`);
            return;
        }

        setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    };

    const handleAddShortcut = async (shortcut) => {
        const newShortcut = {
            id: `s${Date.now().toString()}`,
            title: shortcut.title,
            url: shortcut.url,
            icon: shortcut.icon,
            color: shortcut.color,
            isFavorite: shortcut.isFavorite
        };

        const { error } = await supabase.from('shortcuts').insert({
            id: newShortcut.id,
            title: newShortcut.title,
            url: newShortcut.url,
            icon: newShortcut.icon,
            color: newShortcut.color,
            is_favorite: newShortcut.isFavorite,
            sort_order: shortcuts.length + 1
        });

        if (error) {
            console.error('Supabase shortcut insert error:', error);
            alert(`Gagal menambah shortcut: ${error.message}. Pastikan tabel shortcuts sudah dibuat di Supabase.`);
            return;
        }

        setShortcuts(prev => [...prev, newShortcut]);
    };

    const handleToggleShortcutFavorite = async (id) => {
        const shortcut = shortcuts.find(item => item.id === id);
        if (!shortcut) return;

        const nextFavorite = !shortcut.isFavorite;
        const { error } = await supabase
            .from('shortcuts')
            .update({ is_favorite: nextFavorite })
            .eq('id', id);

        if (error) {
            console.error('Supabase shortcut favorite update error:', error);
            alert(`Gagal update favorit shortcut: ${error.message}. Jalankan ulang shortcuts.sql jika kolom is_favorite belum ada.`);
            return;
        }

        setShortcuts(prev => prev.map(item => item.id === id ? { ...item, isFavorite: nextFavorite } : item));
    };

    const handleDeleteShortcut = async (id) => {
        const { error } = await supabase.from('shortcuts').delete().eq('id', id);

        if (error) {
            console.error('Supabase shortcut delete error:', error);
            alert(`Gagal menghapus shortcut: ${error.message}. Jika ini shortcut default, buat tabel shortcuts lalu seed data terlebih dahulu.`);
            return;
        }

        setShortcuts(prev => prev.filter(shortcut => shortcut.id !== id));
    };

    const handleAddNote = async (noteInput) => {
        const newNote = {
            id: `n${Date.now().toString()}`,
            type: noteInput.type,
            title: noteInput.title || '',
            content: noteInput.content || '',
            issue: noteInput.issue || '',
            decision: noteInput.decision || '',
            picId: noteInput.picId || '',
            deadline: noteInput.deadline || '',
            isDone: noteInput.isDone || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const { error } = await supabase.from('notes').insert({
            id: newNote.id,
            type: newNote.type,
            title: newNote.title || null,
            content: newNote.content || null,
            issue: newNote.issue || null,
            decision: newNote.decision || null,
            pic_id: newNote.picId || null,
            deadline: newNote.deadline || null,
            is_done: newNote.isDone || false,
            updated_at: newNote.updatedAt
        });

        if (error) {
            console.error('Supabase note insert error:', error);
            alert(`Gagal menyimpan notes: ${error.message}. Jalankan notes.sql di Supabase.`);
            return false;
        }

        setNotes(prev => [newNote, ...prev]);
        return true;
    };

    const handleUpdateNote = async (id, noteInput) => {
        const updatedAt = new Date().toISOString();
        const payload = {
            type: noteInput.type,
            title: noteInput.title || null,
            content: noteInput.content || null,
            issue: noteInput.issue || null,
            decision: noteInput.decision || null,
            pic_id: noteInput.picId || null,
            deadline: noteInput.deadline || null,
            is_done: noteInput.isDone || false,
            updated_at: updatedAt
        };

        const { error } = await supabase.from('notes').update(payload).eq('id', id);

        if (error) {
            console.error('Supabase note update error:', error);
            alert(`Gagal update notes: ${error.message}. Jalankan notes.sql di Supabase.`);
            return false;
        }

        setNotes(prev => prev.map(note => note.id === id ? {
            ...note,
            type: noteInput.type,
            title: noteInput.title || '',
            content: noteInput.content || '',
            issue: noteInput.issue || '',
            decision: noteInput.decision || '',
            picId: noteInput.picId || '',
            deadline: noteInput.deadline || '',
            isDone: noteInput.isDone || false,
            updatedAt
        } : note));
        return true;
    };

    const handleDeleteNote = async (id) => {
        const { error } = await supabase.from('notes').delete().eq('id', id);

        if (error) {
            console.error('Supabase note delete error:', error);
            alert(`Gagal hapus notes: ${error.message}. Jalankan notes.sql di Supabase.`);
            return;
        }

        setNotes(prev => prev.filter(note => note.id !== id));
    };

    const handleCreateTaskFromMeeting = (meeting) => {
        const projectId = activeProject || projects[0]?.id || '';
        if (!projectId) {
            alert('Buat project terlebih dahulu sebelum membuat task dari MoM.');
            return;
        }

        setEditingTask({
            id: Date.now().toString(),
            projectId,
            title: meeting.issue || 'Task dari Minute of Meeting',
            status: 'To Do',
            priority: 'Medium',
            deadline: meeting.deadline || '',
            picId: meeting.picId || currentPicId || '',
            todos: meeting.decision ? [{ id: `td${Date.now().toString()}`, title: meeting.decision, done: false, picId: meeting.picId || currentPicId || '' }] : [],
            isNew: true
        });
    };

    const handleAddMember = async () => {
        openDialog({
            type: 'member_prompt',
            message: 'Tambah Anggota Tim Baru:',
            placeholder: 'Nama Anggota (misal: Dodi)',
            required: true,
            onConfirm: async (name, position) => {
                const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                const newMember = { 
                    id: 'm' + Date.now().toString(), 
                    name: name.trim(), 
                    position: position.trim(),
                    color: randomColor
                };

                const { error } = await supabase.from('members').insert(newMember);

                if (error) {
                    console.error('Supabase member insert error:', error);
                    alert(`Gagal menambah anggota: ${error.message}`);
                    return;
                }

                setMembers(prev => [...prev, newMember]);
            }
        });
    };

    const handleDeleteMember = async (id) => {
        openDialog({
            type: 'confirm',
            message: 'Yakin ingin menghapus anggota ini? Tugas yang sedang dikerjakannya akan menjadi tanpa PIC.',
            onConfirm: async () => {
                const { error } = await supabase.from('members').delete().eq('id', id);

                if (error) {
                    console.error('Supabase member delete error:', error);
                    alert(`Gagal menghapus anggota: ${error.message}`);
                    return;
                }

                setMembers(prev => prev.filter(m => m.id !== id));
                setTasks(prev => prev.map(t => t.picId === id ? { ...t, picId: '' } : t));
            }
        });
    };

    const projectTasks = tasks.filter(t => t.projectId === activeProject);
    const currentTasks = projectTasks
        .filter(task => {
            const matchesSearch = (task.title || '').toLowerCase().includes(searchQuery.trim().toLowerCase());
            const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
            const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
            const matchesPic = picFilter === 'all' || (picFilter === 'none' ? !task.picId : task.picId === picFilter);
            return matchesSearch && matchesStatus && matchesPriority && matchesPic;
        })
        .sort((a, b) => {
            if (sortMode === 'deadline_asc') {
                const aTime = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
                const bTime = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
                return aTime - bTime;
            }
            if (sortMode === 'deadline_desc') {
                const aTime = a.deadline ? new Date(a.deadline).getTime() : 0;
                const bTime = b.deadline ? new Date(b.deadline).getTime() : 0;
                return bTime - aTime;
            }
            if (sortMode === 'priority_desc') {
                const rank = { High: 3, Medium: 2, Low: 1 };
                return (rank[b.priority] || 0) - (rank[a.priority] || 0);
            }
            if (sortMode === 'title_asc') {
                return (a.title || '').localeCompare(b.title || '');
            }
            return 0;
        });

    const summaryStats = projectTasks.reduce((stats, task) => {
        const deadlineState = getDeadlineState(task.deadline, task.status);
        return {
            total: stats.total + 1,
            done: stats.done + (task.status === 'Done' ? 1 : 0),
            overdue: stats.overdue + (deadlineState === 'overdue' ? 1 : 0),
            today: stats.today + (deadlineState === 'today' ? 1 : 0)
        };
    }, { total: 0, done: 0, overdue: 0, today: 0 });

    const resetTaskControls = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setPriorityFilter('all');
        setPicFilter('all');
        setSortMode('deadline_asc');
    };

    const closeMobileSidebar = () => setIsSidebarOpen(false);

    const navigateView = (nextView) => {
        setView(nextView);
        closeMobileSidebar();
    };

    const handleSelectProject = (projectId) => {
        setActiveProject(projectId);
        if (view === 'members' || view === 'dashboard' || view === 'notes' || view === 'calendar') setView('table');
        closeMobileSidebar();
    };

    const currentProjectName = projects.find(p => p.id === activeProject)?.name || 'Pilih Project';
    const sortedProjects = [...projects].sort((a, b) => {
        if (a.isPinned === b.isPinned) return 0;
        return a.isPinned ? -1 : 1;
    });

    return (
        <div className="min-h-screen bg-[linear-gradient(135deg,#ede9fe_0%,#e0f2fe_35%,#fce7f3_65%,#dbeafe_100%)] p-0 lg:p-3 font-sans text-slate-900">
        <div className="relative flex h-screen lg:h-[calc(100vh-1.5rem)] w-full max-w-[1720px] mx-auto overflow-hidden bg-white/60 border border-white/70 shadow-2xl backdrop-blur-xl lg:rounded-[32px]">
            {isSidebarOpen && (
                <button
                    type="button"
                    aria-label="Tutup menu"
                    onClick={closeMobileSidebar}
                    className="fixed inset-0 z-[70] bg-slate-950/35 lg:hidden"
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-[80] flex w-72 max-w-[86vw] flex-col border-r border-white/70 bg-white/95 shadow-2xl shadow-slate-900/20 transition-transform duration-300 lg:static lg:z-auto lg:w-64 lg:max-w-none lg:translate-x-0 lg:bg-white/25 lg:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-5 flex items-center justify-between font-semibold transition-colors mb-2">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/20">
                            <img
                                src="https://pub-deabb4838f9345c095b0dbe31add5535.r2.dev/abs%204%20(1).png"
                                alt="Tim Markom"
                                className="w-full h-full object-contain p-1"
                            />
                        </div>
                        <span>Tim Markom</span>
                    </div>
                    <button
                        type="button"
                        onClick={closeMobileSidebar}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-950 lg:hidden"
                        aria-label="Tutup menu"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div className="px-4 mb-2 mt-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Menu Utama</div>
                <nav className="px-3 space-y-1 mb-6">
                    <button
                        onClick={() => navigateView('dashboard')}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-2xl text-sm font-medium transition-all ${view === 'dashboard' ? 'tint-lavender shadow-sm' : 'text-slate-500 hover:bg-white/55 hover:text-slate-900'}`}
                    >
                        <span className="tint-lavender-solid w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0">
                            <i className="fa-solid fa-chart-simple"></i>
                        </span>
                        <span>Dashboard</span>
                    </button>
                    <button
                        onClick={() => navigateView('notes')}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-2xl text-sm font-medium transition-all ${view === 'notes' ? 'tint-peach shadow-sm' : 'text-slate-500 hover:bg-white/55 hover:text-slate-900'}`}
                    >
                        <span className="tint-peach-solid w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0">
                            <i className="fa-regular fa-note-sticky"></i>
                        </span>
                        <span>Notes</span>
                    </button>
                    <button
                        onClick={() => navigateView('calendar')}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-2xl text-sm font-medium transition-all ${view === 'calendar' ? 'tint-pink shadow-sm' : 'text-slate-500 hover:bg-white/55 hover:text-slate-900'}`}
                    >
                        <span className="tint-pink-solid w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0">
                            <i className="fa-regular fa-calendar-days"></i>
                        </span>
                        <span>Kalender Markom</span>
                    </button>
                    <button
                        onClick={() => navigateView('members')}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-2xl text-sm font-medium transition-all ${view === 'members' ? 'tint-mint shadow-sm' : 'text-slate-500 hover:bg-white/55 hover:text-slate-900'}`}
                    >
                        <span className="tint-mint-solid w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0">
                            <i className="fa-solid fa-users"></i>
                        </span>
                        <span>Anggota Tim</span>
                    </button>
                </nav>

                <div className="px-4 mb-2 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider group">
                    <span>Projects Workspace</span>
                    <button onClick={handleAddProject} className="text-gray-400 hover:text-gray-800 p-1 rounded hover:bg-gray-200 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100" title="Tambah Project">
                        <i className="fa-solid fa-plus"></i>
                    </button>
                </div>
                <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                    {sortedProjects.map(project => (
                        <div key={project.id} className="group flex flex-col">
                            <div className="flex items-center justify-between">
                                <button 
                                    onClick={() => handleSelectProject(project.id)}
                                    className={`flex-1 flex items-center space-x-3 px-3 py-2 rounded-2xl text-sm font-medium transition-all text-left truncate ${activeProject === project.id && (view === 'table' || view === 'kanban') ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:bg-white/55 hover:text-slate-900'}`}
                                >
                                    <i
                                        className={`fa-${activeProject === project.id && (view === 'table' || view === 'kanban') ? 'solid' : 'regular'} fa-folder w-5 text-center`}
                                        style={{ color: project.color || '#6b7280' }}
                                    ></i>
                                    <span className="truncate">{project.name}</span>
                                </button>
                                <div className="flex items-center">
                                    <input
                                        type="color"
                                        value={project.color || '#2563eb'}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => handleUpdateProjectColor(project.id, e.target.value, e)}
                                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0 opacity-80 hover:opacity-100 mr-0.5"
                                        title="Ubah warna project"
                                    />
                                    <button
                                        onClick={(e) => handleToggleProjectCalendar(project.id, !project.showInCalendar, e)}
                                        className={`p-1.5 rounded hover:bg-gray-200 transition-colors mr-0.5 ${project.showInCalendar ? 'text-pink-600 opacity-100' : 'text-gray-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100'}`}
                                        title={project.showInCalendar ? 'Sembunyikan dari kalender' : 'Tampilkan di kalender'}
                                    >
                                        <i className={`${project.showInCalendar ? 'fa-solid' : 'fa-regular'} fa-calendar-days text-xs`}></i>
                                    </button>
                                    <button 
                                        onClick={(e) => handleTogglePinProject(project.id, e)}
                                        className={`p-1.5 rounded hover:bg-gray-200 transition-colors mr-0.5 ${project.isPinned ? 'text-orange-500 opacity-100' : 'text-gray-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100'}`}
                                        title={project.isPinned ? "Lepas sematan" : "Sematkan Project (Urgent)"}
                                    >
                                        <i className={`fa-solid fa-thumbtack text-xs ${!project.isPinned ? '-rotate-45' : ''}`}></i>
                                    </button>
                                    <button 
                                        onClick={(e) => handleDeleteProject(project.id, e)}
                                        className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-gray-200 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 mr-1"
                                        title="Hapus Project"
                                    >
                                        <i className="fa-regular fa-trash-can text-xs"></i>
                                    </button>
                                </div>
                            </div>
                            
                            {activeProject === project.id && (view === 'table' || view === 'kanban') && (
                                <div className="ml-7 mt-1 space-y-1 border-l border-white/70 pl-2">
                                    <button 
                                        onClick={() => navigateView('table')}
                                        className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-xl text-xs font-medium transition-colors ${view === 'table' ? 'text-slate-950 bg-white/80' : 'text-slate-500 hover:text-slate-800 hover:bg-white/55'}`}
                                    >
                                        <i className="fa-solid fa-list w-4"></i> Table
                                    </button>
                                    <button 
                                        onClick={() => navigateView('kanban')}
                                        className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-xl text-xs font-medium transition-colors ${view === 'kanban' ? 'text-slate-950 bg-white/80' : 'text-slate-500 hover:text-slate-800 hover:bg-white/55'}`}
                                    >
                                        <i className="fa-solid fa-table-columns w-4"></i> Board
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </nav>
                
                <SidebarLottie picName={members.find(member => member.id === currentPicId)?.name || 'Tim'} />
                <SidebarClock />
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white/35 min-w-0">
                <header className="h-16 border-b border-white/60 flex items-center justify-between gap-3 px-4 lg:px-8 bg-white/25 backdrop-blur">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen(true)}
                            className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white/70 text-slate-700 shadow-sm transition hover:bg-white hover:text-slate-950 lg:hidden"
                            aria-label="Buka menu"
                        >
                            <i className="fa-solid fa-bars"></i>
                        </button>
                        <div className="flex min-w-0 items-center space-x-2 truncate text-sm text-gray-500">
                        {view === 'dashboard' ? (
                            <>
                                <i className="fa-solid fa-chart-simple text-gray-400"></i>
                                <span className="font-medium text-gray-800">Dashboard</span>
                            </>
                        ) : view === 'notes' ? (
                            <>
                                <i className="fa-regular fa-note-sticky text-gray-400"></i>
                                <span className="font-medium text-gray-800">Notes</span>
                            </>
                        ) : view === 'calendar' ? (
                            <>
                                <i className="fa-regular fa-calendar-days text-gray-400"></i>
                                <span className="font-medium text-gray-800">Kalender Markom</span>
                            </>
                        ) : view === 'members' ? (
                            <>
                                <i className="fa-solid fa-users text-gray-400"></i>
                                <span className="font-medium text-gray-800">Daftar Anggota Tim</span>
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-folder-open text-gray-400"></i>
                                <span>{currentProjectName}</span>
                                <span className="text-gray-300">/</span>
                                <span className="font-medium text-gray-800">
                                    {view === 'kanban' && 'Task Board'}
                                    {view === 'table' && 'All Tasks'}
                                </span>
                            </>
                        )}
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {currentPicId && (
                            <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-white/70 bg-white/55 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                                <i className="fa-regular fa-user"></i>
                                <span>{members.find(member => member.id === currentPicId)?.name || 'PIC'}</span>
                            </div>
                        )}
                        <button
                            onClick={handleLockApp}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/70 bg-white/55 text-xs font-semibold text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-950 sm:w-auto sm:px-3 sm:py-2"
                            title="Kunci aplikasi"
                        >
                            <i className="fa-solid fa-lock text-[11px]"></i>
                            <span className="hidden sm:inline">Lock</span>
                        </button>
                        <ShortcutLauncher
                            shortcuts={shortcuts}
                            onAddShortcut={handleAddShortcut}
                            onDeleteShortcut={handleDeleteShortcut}
                            onToggleShortcutFavorite={handleToggleShortcutFavorite}
                        />
                    </div>
                </header>
                
                <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-8 custom-scrollbar">
                    {view === 'dashboard' && (
                        <MainDashboard
                            tasks={tasks}
                            projects={projects}
                            members={members}
                            shortcuts={shortcuts}
                            currentPicId={currentPicId}
                            onEdit={handleEditTask}
                            onQuickAddTask={handleQuickAddTask}
                        />
                    )}

                    {view === 'notes' && (
                        <NotesPage
                            notes={notes}
                            members={members}
                            onAddNote={handleAddNote}
                            onUpdateNote={handleUpdateNote}
                            onDeleteNote={handleDeleteNote}
                            currentPicId={currentPicId}
                            onCreateTaskFromMeeting={handleCreateTaskFromMeeting}
                        />
                    )}

                    {view === 'calendar' && (
                        <MarkomCalendar
                            tasks={tasks}
                            projects={projects}
                            members={members}
                            currentPicId={currentPicId}
                            onEdit={handleEditTask}
                            onCreateTask={handleAddTaskForDate}
                            onToggleProjectCalendar={handleToggleProjectCalendar}
                        />
                    )}

                    {view === 'members' && (
                        <div className="h-full animate-fade-in">
                            <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex flex-wrap items-baseline">
                                Tim Markom
                                <span className="text-gray-400 text-xl font-normal ml-3">Anggota</span>
                            </h2>
                            <MembersTable members={members} onAddMember={handleAddMember} onDeleteMember={handleDeleteMember} />
                        </div>
                    )}

                    {view === 'kanban' && (
                        <div className="h-full animate-fade-in">
                            <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex flex-wrap items-baseline tracking-tight">
                                {currentProjectName}
                                <span className="text-gray-400 text-xl font-normal ml-3">Board</span>
                            </h2>
                            <TaskSummary stats={summaryStats} />
                            <TaskControls
                                members={members}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                statusFilter={statusFilter}
                                setStatusFilter={setStatusFilter}
                                priorityFilter={priorityFilter}
                                setPriorityFilter={setPriorityFilter}
                                picFilter={picFilter}
                                setPicFilter={setPicFilter}
                                sortMode={sortMode}
                                setSortMode={setSortMode}
                                onReset={resetTaskControls}
                            />
                            <KanbanView
                                tasks={currentTasks}
                                members={members}
                                projects={projects}
                                onAdd={handleAddTask}
                                onEdit={handleEditTask} 
                                onDelete={handleDeleteTask}
                                onUpdatePriority={handleUpdatePriority}
                                onUpdateStatus={handleUpdateStatus}
                                onUpdateTask={handleSaveEditedTask}
                            />
                        </div>
                    )}
                    
                    {view === 'table' && (
                        <div className="w-full animate-fade-in">
                            <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex flex-wrap items-baseline tracking-tight">
                                {currentProjectName}
                                <span className="text-gray-400 text-xl font-normal ml-3">Tasks</span>
                            </h2>
                            <TaskSummary stats={summaryStats} />
                            <TaskControls
                                members={members}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                statusFilter={statusFilter}
                                setStatusFilter={setStatusFilter}
                                priorityFilter={priorityFilter}
                                setPriorityFilter={setPriorityFilter}
                                picFilter={picFilter}
                                setPicFilter={setPicFilter}
                                sortMode={sortMode}
                                setSortMode={setSortMode}
                                onReset={resetTaskControls}
                            />
                            <TableView
                                tasks={currentTasks}
                                members={members}
                                projects={projects}
                                onAdd={handleAddTask}
                                onEdit={handleEditTask} 
                                onDelete={handleDeleteTask}
                                onUpdatePriority={handleUpdatePriority}
                                onUpdateStatus={handleUpdateStatus}
                                onUpdateTask={handleSaveEditedTask}
                            />
                        </div>
                    )}
                </main>
            </div>

            </div>

            <CustomDialog dialog={dialog} closeDialog={closeDialog} />
            <TaskEditModal task={editingTask} projects={projects} members={members} isOpen={!!editingTask} onClose={() => setEditingTask(null)} onSave={handleSaveEditedTask} />
        </div>
    );
    
}