import { useCallback } from 'react';

export function useNotifications() {
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;
  
  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, [isSupported]);
  
  const sendNotification = useCallback((title: string, body?: string, onClickPath?: string) => {
    if (!isSupported || Notification.permission !== 'granted') return;
    
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
    });
    
    notification.onclick = () => {
      window.focus();
      if (onClickPath) {
        window.location.href = onClickPath;
      }
      notification.close();
    };
  }, [isSupported]);
  
  const isGranted = isSupported && Notification.permission === 'granted';
  
  return { requestPermission, sendNotification, isSupported, isGranted };
}
