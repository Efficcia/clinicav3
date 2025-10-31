import { useState } from 'react';

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
}

export const useNotification = () => {
  const [notification, setNotification] = useState<Notification>({
    message: '',
    type: 'success',
    isVisible: false
  });

  const showNotification = (message: string, type: Notification['type'] = 'success') => {
    setNotification({ message, type, isVisible: true });
    
    setTimeout(() => {
      setNotification(prev => ({ ...prev, isVisible: false }));
    }, 5000);
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  return {
    notification,
    showNotification,
    hideNotification
  };
};