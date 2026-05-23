<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { useThemeStore } from './stores/theme';

const authStore = useAuthStore();
const themeStore = useThemeStore();

onMounted(() => {
  themeStore.initTheme();
  authStore.init();
});
</script>

<template>
  <div class="app-container">
    <!-- Liquid Ambient Glass Background Spheres -->
    <div class="liquid-bg">
      <div class="liquid-bubble bubble-1"></div>
      <div class="liquid-bubble bubble-2"></div>
      <div class="liquid-bubble bubble-3"></div>
    </div>

    <!-- Main Router Screen View -->
    <div v-if="authStore.loading" class="preloader-overlay">
      <div class="loader-glass">
        <span class="spinner-pulse"></span>
        <span class="loading-text">Cargando RetroDash...</span>
      </div>
    </div>
    
    <router-view v-else v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style>
/* Preloader & Loading Animation Styles */
.preloader-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  background: var(--bg-gradient);
}

.loader-glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: 20px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 320px;
  width: 90%;
}

.spinner-pulse {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #d946ef 100%);
  position: relative;
  animation: pulse 1.6s infinite ease-in-out;
}

.spinner-pulse::after {
  content: '';
  position: absolute;
  inset: 4px;
  background: #0c1226;
  border-radius: 50%;
}

.loading-text {
  font-family: var(--font-family-title);
  font-weight: 500;
  font-size: 16px;
  color: var(--text-primary);
  letter-spacing: 0.05em;
  animation: blink 1.4s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.9);
    opacity: 0.7;
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.5);
  }
  70% {
    transform: scale(1);
    opacity: 1;
    box-shadow: 0 0 0 15px rgba(99, 102, 241, 0);
  }
  100% {
    transform: scale(0.9);
    opacity: 0.7;
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
}

@keyframes blink {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>
