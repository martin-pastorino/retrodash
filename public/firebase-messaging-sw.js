// ==========================================================================
// RetroDash: Service Worker para Notificaciones Push (Firebase Messaging)
// ==========================================================================

// Importar scripts de Firebase compat desde el CDN oficial (v10.13.0)
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Configuración de Firebase pública de RetroDash
const firebaseConfig = {
  apiKey: "AIzaSyCw_YvFN_zDXVWaZjwAMyprZ2Q_uBj22dg",
  authDomain: "retro-dash-c9615.firebaseapp.com",
  projectId: "retro-dash-c9615",
  storageBucket: "retro-dash-c9615.firebasestorage.app",
  messagingSenderId: "791875894614",
  appId: "1:791875894614:web:456e22f9834f20458deaf7",
  measurementId: "G-9QK9HQ6623"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar Firebase Cloud Messaging
const messaging = firebase.messaging();

// Capturar mensajes Push en segundo plano (cuando la app está cerrada o minimizada)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Notificación Push en background recibida:', payload);

  // Extraer los datos del payload de forma flexible (soportando tanto estructura estándar de Firebase como claves personalizadas en data)
  const title = payload.notification?.title || payload.data?.title || 'RetroDash — ¡Alerta!';
  
  // Utilizar un emoji de resplandor como fallback si no hay ícono definido
  const defaultIcon = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220%22 width=%22100%22 height=%22100%22><text y=%220.9em%22 font-size=%2290%22>✨</text></svg>';
  const icon = payload.notification?.icon || payload.data?.icon || defaultIcon;

  const options = {
    body: payload.notification?.body || payload.data?.body || '¡Tenés una nueva actualización en tus tableros!',
    icon: icon,
    badge: icon, // Ícono pequeño para la barra de estado en Android
    tag: payload.data?.tag || 'retrodash-board-update', // Agrupa notificaciones similares
    requireInteraction: true, // Mantiene la notificación abierta hasta que el usuario interactúe
    data: {
      url: payload.data?.url || '/' // URL de redirección cuando el usuario hace click (ej. la ruta /retro/:id)
    }
  };

  // Mostrar la notificación nativa usando el registro del Service Worker
  return self.registration.showNotification(title, options);
});

// Manejar el evento de click en la notificación (redireccionar e interactuar de forma fluida)
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Cerrar la notificación inmediatamente
  
  // Obtener la URL de redirección asociada
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Buscar si ya hay alguna pestaña/ventana abierta en la misma URL de destino para enfocarla
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        
        // Comprobar si la URL del cliente coincide o contiene la ruta de RetroDash
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Si no hay pestañas abiertas en la app, abrir una nueva pestaña
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
