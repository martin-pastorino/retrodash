import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { notifications } from './services/notifications';

// Global Stylesheet
import './style.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);

// Register Router in the Desktop Notification Manager
notifications.setRouter(router);

app.mount('#app');
