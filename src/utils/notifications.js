let audioCtx;
function playTone(frequency) {
  if (typeof window === 'undefined') return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  audioCtx = audioCtx || new AudioContext();
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.frequency.value = frequency;
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start();
  gain.gain.setValueAtTime(1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  oscillator.stop(audioCtx.currentTime + 0.2);
}

// Запрашивает разрешение на показ уведомлений
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

// Показывает push-уведомление в поддерживаемых браузерах
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

// Проигрывает звук для новой задачи
export function playTaskSound() {
  playTone(440);
}

// Проигрывает звук для нового сообщения
export function playMessageSound() {
  playTone(660);
}
