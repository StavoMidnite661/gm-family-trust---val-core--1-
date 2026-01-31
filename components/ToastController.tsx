
import React, { useState, useEffect, useCallback } from 'react';
import Toast, { ToastAppearance } from './Toast';

interface ToastData {
    id: string;
    message: string;
    appearance: ToastAppearance;
    timeout?: number;
    action?: React.ReactNode;
}

const MAX_TOASTS = 3;

const ToastController: React.FC = () => {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const addToast = useCallback((data: Omit<ToastData, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setToasts(prev => {
            const newToasts = [...prev, { ...data, id }];
            // Limit to MAX_TOASTS by dismissing the oldest
            if (newToasts.length > MAX_TOASTS) {
                return newToasts.slice(newToasts.length - MAX_TOASTS);
            }
            return newToasts;
        });
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    useEffect(() => {
        const handleCreateToast = (event: any) => {
            const { message, appearance, timeout, action } = event.detail;
            addToast({ message, appearance, timeout, action });
        };

        window.addEventListener('jh-create-toast' as any, handleCreateToast);
        return () => {
            window.removeEventListener('jh-create-toast' as any, handleCreateToast);
        };
    }, [addToast]);

    return (
        <div 
            className="fixed top-8 right-8 z-[200] flex flex-col gap-4 pointer-events-none"
            aria-live="polite"
        >
            {toasts.map(toast => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast
                        id={toast.id}
                        message={toast.message}
                        appearance={toast.appearance}
                        timeout={toast.timeout}
                        onDismiss={removeToast}
                        action={toast.action}
                    />
                </div>
            ))}
        </div>
    );
};

export default ToastController;
