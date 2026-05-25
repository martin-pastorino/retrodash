# Guía del Agente & Arquitectura del Proyecto (AGENT.md)

¡Hola, **Martin**! Este documento sirve como el mapa oficial de arquitectura, estructura y lineamientos del proyecto **RetroDash**. Como tu compañero de desarrollo, he estructurado esta guía con un análisis técnico profundo y sincero, destacando los puntos fuertes del diseño actual y las oportunidades críticas de mejora para asegurar la máxima escalabilidad y rendimiento de la plataforma.

---

## 🚀 Puntos Clave de la Infraestructura
- **Gestor de Paquetes:** `pnpm` (Obligatorio para toda la instalación, gestión de dependencias y scripts de ejecución).
- **Core Stack:** Vue 3 (Composition API, `<script setup>`), Pinia para gestión de estado global, Vue Router para navegación fluida.
- **Backend / Tiempo Real:** Firebase Suite (Auth, Cloud Firestore para sincronización bidireccional y reactiva en tiempo real sin WebSockets adicionales, Firebase Hosting para despliegue).
- **Inteligencia Artificial:** Gemini API (`@google/generative-ai` con el modelo `gemini-2.5-flash`) actuando como Agile Facilitator & Coach.
- **Diseño Estético:** UI Glassmorphism de alta calidad con gradientes dinámicos, micro-animaciones premium, temas Claro/Oscuro y un enfoque Mobile-First óptimo.

---

## 📂 Arquitectura del Directorio del Proyecto

La estructura del código fuente sigue un patrón modular limpio y predecible:

```
retro-dash/
├── .env.local                   # Configuración de variables de entorno locales (API Keys de Firebase y Gemini)
├── firestore.rules              # Reglas de seguridad declarativas de Cloud Firestore
├── firestore.indexes.json       # Definición de índices de base de datos
├── package.json                 # Definición del proyecto y scripts
├── pnpm-lock.yaml               # Lockfile estricto de dependencias de pnpm
├── vite.config.js               # Configuración de Vite optimizada para chunks de compilación
├── index.html                   # Entrada principal HTML5 optimizada para SEO
├── src/
│   ├── main.js                  # Inicialización y montaje de la aplicación Vue
│   ├── App.vue                  # Componente raíz con fondo líquido reactivo y preloader de Auth
│   ├── style.css                # Sistema de diseño centralizado (tokens, paletas HSL, glassmorphism)
│   ├── firebase.js              # Configuración y arranque del SDK de Firebase
│   │
│   ├── router/
│   │   └── index.js             # Enrutador con Route Guards asíncronos para control de accesos (Auth)
│   │
│   ├── stores/
│   │   ├── auth.js              # Gestión global de sesión del usuario (Google Sign-In)
│   │   ├── board.js             # Lógica de tableros, subcolección de tarjetas y estados reactivos en Firestore
│   │   └── theme.js             # Almacenamiento local del tema preferido (light/dark)
│   │
│   ├── services/
│   │   ├── gemini.js            # Servicio de integración con el SDK oficial de Gemini AI (Coach Facilitador)
│   │   └── notifications.js     # Manager para push notifications locales y recordatorios de retrospectivas
│   │
│   ├── views/
│   │   ├── LoginView.vue        # Vista de acceso limpia y estética usando autenticación de Google
│   │   ├── DashboardView.vue    # Panel de control de usuario (Tus Tableros, Crear Tablero, Sumarse)
│   │   └── RetroBoardView.vue   # Vista central de la retro (Fases: Lluvia de ideas, Votación, Acción IA)
│   │
│   └── components/
│       ├── CreateBoardModal.vue # Creador dinámico de tableros (columnas custom, temporizadores y participantes)
│       ├── DeleteConfirmModal.vue# Confirmación segura e irreversible de borrado de tablero
│       ├── SettingsModal.vue    # Configuración de credenciales de usuario y llaves de API
│       ├── JoinBoardWidget.vue  # Acceso rápido a retrospectivas compartidas mediante ID
│       ├── BoardHeader.vue      # Barra de controles de la retrospectiva activa (Timer, Fases, Configuración)
│       ├── ColumnLane.vue       # Carril de columnas con degradado estético para agrupar tarjetas
│       ├── RetroCard.vue        # Tarjetas de retrospectiva interactivas con sistema de votos
│       └── AiActionables.vue    # Panel interactivo de previsualización y asignación del Plan de Acción IA
```

---

## 🧠 Flujo de la Inteligencia Artificial (Gemini AI Coach)

El servicio `gemini.js` proporciona retroalimentación experta al equipo en la fase final de cada retrospectiva utilizando el modelo `gemini-2.5-flash`:
1. **Filtrado Inteligente:** Recopila todas las tarjetas cargadas por los participantes y descarta aquellas sin votos para enfocar los recursos en las ideas más validadas por el equipo.
2. **Rol Definido:** Se inyecta un prompt sistémico que posiciona a Gemini como un **Facilitador Agile y Scrum Coach experto** con actitud sumamente sincera, constructiva y motivadora en español.
3. **Estructura JSON Estricta:** Genera un análisis semántico del estado de ánimo grupal (`moodSummary`), asocia un emoji representativo (`moodEmoji`) y define un **Plan de Acción de hasta 3 accionables concretos** con justificación basada en los comentarios.
4. **Previsualización & Persistencia:** Los accionables se presentan en formato de borrador interactivo en `AiActionables.vue` donde los usuarios pueden ajustar responsabilidades e hitos antes de guardarlos formalmente en Firestore.

---

## 🎯 Análisis de Calidad Técnica del Proyecto

En base a las directrices de nuestra guía de trabajo, presento una auditoría totalmente directa, sincera y objetiva sobre la calidad del código existente.

### 🌟 Lo que está bien hecho (Fortalezas)
1. **Reactividad al Instante (Sincronización Firestore):** El uso de subscripciones mediante `onSnapshot` acoplado con ciclos de vida de Vue (`onMounted` / `onUnmounted`) garantiza una experiencia impecable donde los participantes ven votos, columnas y tarjetas sincronizarse al instante sin lags ni necesidad de WebSocket APIs complejas.
2. **Control de Fugas de Memoria (Memory Leaks):** El store `board.js` maneja apropiadamente la limpieza de subscripciones asíncronas de Firebase con la función `unsubscribeAll` y devolviendo callbacks de desconexión en `fetchUserBoards`. Esto previene consumos innecesarios en segundo plano.
3. **División Eficiente de Chunks en Vite:** La configuración en `vite.config.js` está excelentemente optimizada separando las librerías pesadas como Firebase y Google Generative AI en chunks asíncronos (`firebase` y `google-ai`), reduciendo el tamaño del bundle inicial y acelerando el *First Contentful Paint (FCP)*.
4. **Diseño Visual de Vanguardia:** El sistema de diseño CSS utiliza variables HSL avanzadas, difuminados fluidos de backdrop-filter, y clases utilitarias personalizadas para crear una de las interfaces de glassmorphism mejor logradas.

### ⚠️ Lo que está en el DEBE (Oportunidades Críticas de Mejora / Deuda Técnica)
1. **Reglas de Seguridad Excesivamente Permisivas en Subcolecciones:**
   * **Problema:** En `firestore.rules`, la regla para `/boards/{boardId}/cards/{cardId}` realiza múltiples llamadas `get()` al documento del tablero padre para validar la autoría y los participantes.
   * **Impacto:** Esto incrementa drásticamente las lecturas en Firestore facturadas por Google y puede ralentizar las operaciones de escritura/lectura rápidas de tarjetas.
   * **Solución elegante:** Podríamos desnormalizar el ID del creador y el arreglo de participantes directamente en cada documento de tarjeta para resolver validaciones en $O(1)$ lecturas de reglas de seguridad, o usar `request.auth.token.email` directamente en consultas superficiales.
2. **Acoplamiento Directo en la Modificación de Arreglos en Firestore:**
   * **Problema:** La lógica de actualizar un ítem del plan de acción en `updateActionItemStatus` descarga el tablero completo, mapea el arreglo localmente en el cliente, y vuelve a escribir todo el arreglo modificado en Firestore.
   * **Impacto:** Riesgo extremo de condiciones de carrera si dos usuarios actualizan el estado de dos accionables distintos en paralelo (una escritura sobrescribirá a la otra).
   * **Solución elegante:** Utilizar operaciones de actualización de arreglos atómicas de Firestore si es viable, o idealmente mover los ítems de acción a una subcolección `/boards/{boardId}/actionItems/{itemId}` para un manejo de documentos individuales.
3. **Validación Débil en Formatos de Fecha locales:**
   * **Problema:** En `CreateBoardModal.vue` y `board.js`, la fecha programada se maneja como un string plano proveniente de un input HTML5 datetime-local (`newBoardScheduledAt`). Esto puede variar drásticamente de formato entre diferentes navegadores y sistemas operativos.
   * **Impacto:** Errores de análisis temporal al renderizar y clasificar los tableros en el Dashboard entre En Curso/Programadas en dispositivos móviles antiguos.
   * **Solución elegante:** Sanitizar y convertir consistentemente a instancias `Timestamp` de Firestore o almacenar las fechas estrictamente en formato ISO 8601 UTC en la base de datos.

---

## 🛠️ Lineamientos para el Trabajo con este Código

Cualquier agente de IA o programador que interactúe con este repositorio debe seguir obligatoriamente las siguientes reglas:
1. **Uso Exclusivo de pnpm:** Ejecutar siempre `pnpm install`, `pnpm dev` y `pnpm build`. Queda terminantemente prohibido generar archivos `package-lock.json` de npm o `yarn.lock`.
2. **Mantener la Sincronización en Tiempo Real:** Toda nueva consulta o carga de datos que afecte al tablero interactivo debe consumir servicios reactivos con `onSnapshot` y registrar debidamente su función de retorno para limpieza en `onUnmounted`.
3. **Optimización CSS Glassmorphism:** Evitar agregar clases ad-hoc que rompan el sistema estético. Si se necesita un elemento nuevo, usar el catálogo de variables `--glass-*` y la paleta HSL definida en `style.css` para mantener la consistencia visual y soporte de temas automático.
4. **Desempaquetado de Proxies de Vue:** Antes de enviar cualquier objeto proveniente de un store reactivo (ej. `authStore.user`) al SDK de Firestore, se debe desempaquetar manualmente a un objeto plano plano (como se hizo con `userPlane` en `DashboardView.vue`) para evitar que Firebase falle al intentar serializar proxies reactivos de Vue 3.
