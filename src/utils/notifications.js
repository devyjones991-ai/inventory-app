export function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'default') {
    try {
      Notification.requestPermission();
    } catch (err) {
      console.error('Notification permission error:', err);
    }
  }
}

export function pushNotification(title, body) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, { body });
    } catch (err) {
      console.error('Notification error:', err);
    }
  }
}
