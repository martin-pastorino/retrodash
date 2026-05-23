<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { Chrome } from 'lucide-vue-next'; // Chrome represents Google Auth nicely here!

const authStore = useAuthStore();
const router = useRouter();
const errorMessage = ref('');
const isLoggingIn = ref(false);

const handleGoogleLogin = async () => {
  isLoggingIn.value = true;
  errorMessage.value = '';
  try {
    await authStore.loginWithGoogle();
    router.push({ name: 'dashboard' });
  } catch (error) {
    console.error(error);
    errorMessage.value = 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.';
  } finally {
    isLoggingIn.value = false;
  }
};
</script>

<template>
  <div class="login-view">
    <div class="login-card glass-panel">
      <div class="brand-logo">
        <div class="logo-sphere">
          <span class="logo-icon">✨</span>
        </div>
        <h1>RetroDash</h1>
        <p class="tagline">Retrospectivas Inteligentes en Tiempo Real</p>
      </div>

      <div class="divider"></div>

      <div class="login-description">
        <p>Crea, comparte y colabora en tableros de retrospectiva de manera segura y en tiempo real.</p>
        <ul>
          <li>🔒 Lluvia de ideas oculta para evitar sesgos</li>
          <li>⏱️ Temporizador sincronizado en tiempo real</li>
          <li>📊 Votación interactiva y democrática</li>
          <li>🧠 Accionables automáticos sugeridos por IA (Gemini)</li>
        </ul>
      </div>

      <div v-if="errorMessage" class="error-banner">
        <span>⚠️ {{ errorMessage }}</span>
      </div>

      <button 
        @click="handleGoogleLogin" 
        :disabled="isLoggingIn" 
        class="glass-btn glass-btn-primary google-login-btn"
      >
        <component :is="Chrome" class="btn-icon" />
        <span>{{ isLoggingIn ? 'Iniciando sesión...' : 'Entrar con Google (Gmail)' }}</span>
      </button>
      
      <p class="disclaimer">Solo cuentas de Google permitidas.</p>
    </div>
  </div>
</template>

<style scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.login-card {
  max-width: 480px;
  width: 100%;
  padding: 48px 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.brand-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.logo-sphere {
  width: 80px;
  height: 80px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: inset 0 2px 4px rgba(255,255,255,0.2), 0 8px 24px rgba(0,0,0,0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 38px;
  margin-bottom: 8px;
}

.brand-logo h1 {
  font-size: 32px;
  background: linear-gradient(135deg, #f3f4f6 30%, #a5b4fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.tagline {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 100%);
}

.login-description {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.login-description ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-left: 4px;
}

.login-description li {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
  font-weight: 500;
}

.error-banner {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  color: #fca5a5;
  text-align: left;
}

.google-login-btn {
  justify-content: center;
  font-size: 16px;
  padding: 14px 28px;
  width: 100%;
}

.btn-icon {
  width: 20px;
  height: 20px;
}

.disclaimer {
  font-size: 12px;
  color: var(--text-muted);
}
</style>
