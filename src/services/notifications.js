// ==========================================================================
// RetroDash: Clientside Push Notification & Firebase Messaging Service
// ==========================================================================

import { app, db } from '../firebase';
import { isSupported, getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

class NotificationManager {
  constructor() {
    this.scheduledTimeouts = new Map(); // boardId -> timeoutId
    this.router = null;
    this.messaging = null;
    this.supported = false;

    // Verificar soporte asíncrono e inicializar FCM
    this.checkSupport();
  }

  // Register Vue Router instance for fluid SPA navigation
  setRouter(router) {
    this.router = router;
  }

  // Check asynchronously if Firebase Cloud Messaging is supported by the current browser
  async checkSupport() {
    try {
      const supported = await isSupported();
      this.supported = supported;
      debugger;
      if (supported) {
        this.messaging = getMessaging(app);
        
        // Registrar explícitamente el Service Worker para garantizar que esté disponible para FCM
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/firebase-messaging-sw.js')
            .then((registration) => {
              console.log('✅ [Service Worker] Registrado con éxito, scope:', registration.scope);
            })
            .catch((error) => {
              console.error('❌ [Service Worker] Error al registrar el Service Worker:', error);
            });
        }

        this.setupForegroundListener();
      }
      return supported;
    } catch (error) {
      console.warn('🔔 [FCM] Las notificaciones push no son soportadas en este entorno/navegador:', error);
      this.supported = false;
      return false;
    }
  }

  // Request browser Notification permissions and register/sync FCM token in Firestore
  async requestPermission(userId = null) {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones de escritorio.');
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      
      // Si el permiso es concedido y FCM es soportado, obtenemos y registramos el token
      if (permission === 'granted' && userId) {
        await this.syncFcmToken(userId);
      }

      return permission;
    } catch (error) {
      console.error('Error al solicitar permisos de notificación:', error);
      return 'denied';
    }
  }

  // Synchronize FCM Token with Firestore (Multidevice Support)
  async syncFcmToken(userId) {
    const isFcmReady = await this.checkSupport();
    if (!isFcmReady || !this.messaging || !userId) return null;

    try {
      // Obtener la VAPID Key desde el entorno o fallback de desarrollo
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      
      // DX (Developer Experience): Si no hay VAPID Key o es el placeholder, informamos y evitamos llamar a Firebase
      if (!vapidKey || vapidKey.includes('placeholder') || vapidKey === 'tu_vapid_key_publica_de_firebase_aqui') {
        console.warn(
          '💡 [FCM] Notificaciones Push activadas localmente en el navegador.\n' +
          '   Para persistir el token multidispositivo en la colección "users" de Firestore:\n' +
          '   1. Generá tu VAPID Key en la Consola de Firebase (Cloud Messaging -> Web Configuration).\n' +
          '   2. Pegala en tu archivo `.env.local` en la variable `VITE_FIREBASE_VAPID_KEY`.\n' +
          '   3. Reiniciá tu servidor de desarrollo (`pnpm dev`).'
        );
        return null;
      }

      console.log('⏱️ Solicitando token de Firebase Cloud Messaging...');
      
      // Obtener el Service Worker activo si existe
      let registration;
      try {
        registration = await navigator.serviceWorker.ready;
      } catch (swError) {
        console.warn('⚠️ No se pudo verificar navigator.serviceWorker.ready de forma inmediata. Continuando registro de token estándar.');
      }
      
      // Obtener el token FCM de Firebase de forma flexible
      const tokenOptions = { vapidKey: vapidKey };
      if (registration) {
        tokenOptions.serviceWorkerRegistration = registration;
      }

      const token = await getToken(this.messaging, tokenOptions);

      if (token) {
        await this.saveTokenToFirestore(userId, token);
        return token;
      } else {
        console.warn('⚠️ No se pudo obtener el token de FCM. Verifica que las notificaciones estén permitidas en el navegador.');
        return null;
      }
    } catch (error) {
      console.error('❌ Error al sincronizar el token FCM con Firebase. Detalles:', error);
      return null;
    }
  }

  // Save specific token to user's tokens subcollection in Firestore
  async saveTokenToFirestore(userId, token) {
    try {
      const tokenRef = doc(db, 'users', userId, 'fcmTokens', token);
      await setDoc(tokenRef, {
        token: token,
        updatedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        platform: navigator.platform || 'web'
      });
      console.log('💎 [FCM] Token multidispositivo guardado en Firestore.');
    } catch (error) {
      console.error('Error al guardar el token FCM en Firestore:', error);
    }
  }

  // Disable push notifications: revoke current FCM token from Firestore
  async disablePushNotifications(userId) {
    const isFcmReady = await this.checkSupport();
    if (!isFcmReady || !this.messaging || !userId) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BDe_placeholder_vapid_key_para_retro_dash_reemplazar_con_tu_clave_real_de_firebase_fcm';
      
      const token = await getToken(this.messaging, {
        serviceWorkerRegistration: registration,
        vapidKey: vapidKey
      });

      if (token) {
        const tokenRef = doc(db, 'users', userId, 'fcmTokens', token);
        await deleteDoc(tokenRef);
        console.log('🗑️ [FCM] Token removido de Firestore.');
      }
    } catch (error) {
      console.error('Error al revocar el token FCM de Firestore:', error);
    }
  }

  // Setup foreground listener to handle messages while app is in focus
  setupForegroundListener() {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('📢 [FCM] Mensaje recibido en primer plano (foreground):', payload);
      
      // Mostrar alerta sutil integrada para no interrumpir pero mantener informado
      this.triggerForegroundNotification(payload);
    });
  }

  // Display a custom local notification for foreground messages
  triggerForegroundNotification(payload) {
    if (Notification.permission !== 'granted') return;

    try {
      const title = payload.notification?.title || payload.data?.title || 'RetroDash';
      const defaultIcon = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220%22 width=%22100%22 height=%22100%22><text y=%220.9em%22 font-size=%2290%22>✨</text></svg>';
      const icon = payload.notification?.icon || payload.data?.icon || defaultIcon;

      const options = {
        body: payload.notification?.body || payload.data?.body || 'Nueva actualización en tus retrospectivas.',
        icon: icon,
        badge: icon,
        tag: payload.data?.tag || 'retrodash-fg-alert',
        requireInteraction: false // autoclose on interaction
      };

      const notification = new Notification(title, options);

      notification.onclick = () => {
        window.focus();
        const url = payload.data?.url;
        if (url) {
          // Extraer la ruta relativa si pertenece a la misma app
          const cleanPath = url.replace(window.location.origin, '');
          if (this.router) {
            this.router.push(cleanPath);
          } else {
            window.location.href = cleanPath;
          }
        }
        notification.close();
      };
    } catch (error) {
      console.error('Error al disparar la notificación en primer plano:', error);
    }
  }

  // ==========================================
  // Local Clientside Reminders (Legacy Support)
  // ==========================================

  // Schedule a notification 10 minutes before the retro starts (local timer fallback)
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

  // Trigger the actual visual browser Notification (local timer alert)
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
      console.error('Error al disparar la notificación local:', error);
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
