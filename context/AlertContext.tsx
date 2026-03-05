import ConfirmationModal from '@/components/ConfirmationModal';
import React, { createContext, ReactNode, useContext, useState } from 'react';

type ShowAlertParams = {
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
};

type ShowConfirmParams = {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
};

interface AlertContextData {
    showAlert: (title: string, message: string, params?: Omit<ShowAlertParams, 'title' | 'message'>) => Promise<void>;
    showConfirm: (title: string, message: string, params?: Omit<ShowConfirmParams, 'title' | 'message'>) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextData | undefined>(undefined);

export function useAlert() {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
}

interface AlertState {
    visible: boolean;
    type: 'alert' | 'confirm';
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    isDestructive: boolean;
    resolve?: (value: boolean) => void;
}

const initialState: AlertState = {
    visible: false,
    type: 'alert',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Avbryt',
    isDestructive: false,
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<AlertState>(initialState);

    const showAlert = (title: string, message: string, params?: Omit<ShowAlertParams, 'title' | 'message'>): Promise<void> => {
        return new Promise((resolve) => {
            setState({
                ...initialState,
                visible: true,
                type: 'alert',
                title,
                message,
                confirmText: params?.confirmText || 'OK',
                isDestructive: params?.isDestructive || false,
                resolve: () => resolve(),
            });
        });
    };

    const showConfirm = (title: string, message: string, params?: Omit<ShowConfirmParams, 'title' | 'message'>): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({
                ...initialState,
                visible: true,
                type: 'confirm',
                title,
                message,
                confirmText: params?.confirmText || 'OK',
                cancelText: params?.cancelText || 'Avbryt',
                isDestructive: params?.isDestructive ?? true, // Default destructive to true for confirms to match old behavior
                resolve,
            });
        });
    };

    const handleConfirm = () => {
        if (state.resolve) state.resolve(true);
        setState(initialState);
    };

    const handleCancel = () => {
        if (state.resolve && state.type === 'confirm') {
            state.resolve(false);
        } else if (state.resolve) {
            // For alerts, cancelling is the same as confirming (dismissing)
            state.resolve(true);
        }
        setState(initialState);
    };

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            <ConfirmationModal
                visible={state.visible}
                title={state.title}
                message={state.message}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                confirmText={state.confirmText}
                cancelText={state.cancelText}
                isDestructive={state.isDestructive}
                singleButton={state.type === 'alert'}
            />
        </AlertContext.Provider>
    );
};
