'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    duration?: number;
}

interface ToastContextType {
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback(({ type, title, message, duration = 5000 }: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = { id, type, title, message, duration };

        setToasts((prev) => [...prev, newToast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
    return (
        <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const bgColors = {
        success: 'bg-white border-l-4 border-success text-text-primary',
        error: 'bg-white border-l-4 border-error text-text-primary',
        info: 'bg-white border-l-4 border-blue-500 text-text-primary',
        warning: 'bg-white border-l-4 border-accent text-text-primary',
    };

    const icons = {
        success: '🎉',
        error: '⚠️',
        info: 'ℹ️',
        warning: '🔔',
    };

    return (
        <div
            className={`${bgColors[toast.type]} shadow-lg rounded p-4 pointer-events-auto min-w-[300px] flex items-start gap-3 animate-slide-in relative overflow-hidden`}
        >
            <div className="text-xl">{icons[toast.type]}</div>
            <div className="flex-1">
                {toast.title && <h4 className="font-semibold text-sm mb-1">{toast.title}</h4>}
                <p className="text-sm text-text-secondary">{toast.message}</p>
            </div>
            <button
                onClick={() => onRemove(toast.id)}
                className="text-text-tertiary hover:text-text-primary"
            >
                ×
            </button>
            {/* Progress Bar Animation */}
            <div className="absolute bottom-0 left-0 h-1 bg-current opacity-20 w-full animate-toast-progress" style={{ animationDuration: `${toast.duration}ms` }} />
        </div>
    );
}
