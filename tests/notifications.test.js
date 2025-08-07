import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { requestNotificationPermission, pushNotification } from '../src/utils/notifications.js';

describe('notifications utils', () => {
  let originalNotification;

  beforeEach(() => {
    originalNotification = global.Notification;
  });

  afterEach(() => {
    global.Notification = originalNotification;
    if (originalNotification) {
      window.Notification = originalNotification;
    } else {
      delete window.Notification;
    }
    vi.restoreAllMocks();
  });

  it('requests permission when status is default', () => {
    const requestPermission = vi.fn();
    const mockNotification = { permission: 'default', requestPermission };
    global.Notification = mockNotification;
    window.Notification = mockNotification;
    requestNotificationPermission();
    expect(requestPermission).toHaveBeenCalled();
  });

  it('shows notification when permission granted', () => {
    const constructor = vi.fn();
    constructor.permission = 'granted';
    global.Notification = constructor;
    window.Notification = constructor;
    pushNotification('Title', 'Body');
    expect(constructor).toHaveBeenCalledWith('Title', { body: 'Body' });
  });

  it('does not show notification when permission denied', () => {
    const constructor = vi.fn();
    constructor.permission = 'denied';
    global.Notification = constructor;
    window.Notification = constructor;
    pushNotification('Title', 'Body');
    expect(constructor).not.toHaveBeenCalled();
  });
});
