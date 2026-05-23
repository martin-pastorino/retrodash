// ==========================================
// RetroDash: Clientside Push Notification Service
// ==========================================

class NotificationManager {
  constructor() {
    this.scheduledTimeouts = new Map(); // boardId -> timeoutId
    this.router = null;
  }

  // Register Vue Router instance for fluid SPA navigation
  setRouter(router) {
    this.router = router;
  }

  // Request browser Notification permissions
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones de escritorio.');
      return 'unsupported';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Error al solicitar permisos de notificación:', error);
      return 'denied';
    }
  }

  // Schedule a notification 10 minutes before the retro starts
  schedule(board) {
    if (!board || !board.scheduledAt || !board.id) return;
    if (Notification.permission !== 'granted') return;

    // Clear previous timeouts for this board if any
    this.cancel(board.id);

    const scheduledTime = new Date(board.scheduledAt).getTime();
    const notificationTime = scheduledTime - 10 * 60 * 1000; // 10 minutes before
    const now = new Date().getTime();

    const timeUntilNotification = notificationTime - now;

    // Only schedule if the notification time is in the future
    // and within a reasonable window (e.g., next 24 hours) to avoid huge timers
    const maxFutureWindow = 24 * 60 * 60 * 1000; // 24 hours
    
    if (timeUntilNotification > 0 && timeUntilNotification < maxFutureWindow) {
      console.log(`⏱️ Notificación programada para la retro "${board.name}" en ${Math.round(timeUntilNotification / 60000)} minutos.`);
      
      const timeoutId = setTimeout(() => {
        this.trigger(board);
        this.scheduledTimeouts.delete(board.id);
      }, timeUntilNotification);

      this.scheduledTimeouts.set(board.id, timeoutId);
    }
  }

  // Trigger the actual visual browser Notification
  trigger(board) {
    try {
      const options = {
        body: `✨ La retrospectiva "${board.name}" comenzará en 10 minutos. ¡Prepárate para participar!`,
        icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220%22 width=%22100%22 height=%22100%22><text y=%220.9em%22 font-size=%2290%22>✨</text></svg>',
        tag: `retro-notify-${board.id}`,
        requireInteraction: true // keep open until clicked
      };

      const notification = new Notification('RetroDash — ¡Próxima Retro!', options);

      notification.onclick = () => {
        window.focus();
        if (this.router) {
          this.router.push({ name: 'retro', params: { id: board.id } });
        } else {
          window.location.href = `/retro/${board.id}`; // fallback
        }
        notification.close();
      };
    } catch (error) {
      console.error('Error al disparar la notificación:', error);
    }
  }

  // Cancel scheduled notification
  cancel(boardId) {
    if (this.scheduledTimeouts.has(boardId)) {
      clearTimeout(this.scheduledTimeouts.get(boardId));
      this.scheduledTimeouts.delete(boardId);
    }
  }

  // Cancel all active timeouts (for cleanup on logout)
  cancelAll() {
    this.scheduledTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.scheduledTimeouts.clear();
  }
}

export const notifications = new NotificationManager();
