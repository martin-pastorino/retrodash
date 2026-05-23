<script setup>
import { ref } from 'vue';
import { Lock, ChevronRight, Hash } from 'lucide-vue-next';

const emit = defineEmits(['join']);

const boardCodeInput = ref('');
const joinError = ref('');

const handleJoin = () => {
  const code = boardCodeInput.value.trim();
  if (!code) return;
  
  joinError.value = '';
  emit('join', code, (errorMsg) => {
    if (errorMsg) {
      joinError.value = errorMsg;
    }
  });
};
</script>

<template>
  <div class="join-section glass-panel">
    <div class="join-content">
      <div class="join-header">
        <div class="icon-wrapper">
          <component :is="Lock" class="icon-indigo" />
        </div>
        <div class="header-text">
          <h3>Sumarse a una Retro</h3>
          <p>Introduce el ID del tablero para participar en tiempo real.</p>
        </div>
      </div>
      
      <div class="join-form">
        <div class="input-container">
          <component :is="Hash" class="input-icon" />
          <input 
            v-model="boardCodeInput" 
            type="text" 
            placeholder="ID del tablero..." 
            class="glass-input join-input"
            @keyup.enter="handleJoin"
          />
        </div>
        <button @click="handleJoin" class="glass-btn join-btn" :disabled="!boardCodeInput.trim()">
          <span>Unirse</span>
          <component :is="ChevronRight" class="icon-sm" />
        </button>
      </div>
      <p v-if="joinError" class="error-text">{{ joinError }}</p>
    </div>
  </div>
</template>

<style scoped>
.join-section {
  padding: 32px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
}

.join-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
  z-index: 0;
}

.join-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 32px;
}

.join-header {
  display: flex;
  align-items: center;
  gap: 20px;
  max-width: 480px;
}

.icon-wrapper {
  flex-shrink: 0;
}

.icon-indigo {
  width: 48px;
  height: 48px;
  color: #818cf8;
  background: rgba(99, 102, 241, 0.12);
  padding: 10px;
  border-radius: 16px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.header-text h3 {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 6px;
  letter-spacing: -0.02em;
}

.header-text p {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.join-form {
  display: flex;
  gap: 16px;
  flex: 1;
  max-width: 460px;
}

.input-container {
  position: relative;
  flex: 1;
}

.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.3);
}

.join-input {
  width: 100%;
  padding-left: 44px;
  height: 52px;
  font-size: 15px;
  transition: all 0.3s ease;
}

.join-input:focus {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(99, 102, 241, 0.4);
}

.join-btn {
  height: 52px;
  padding: 0 28px;
  background: var(--indigo-600);
  border: none;
  font-weight: 600;
  color: white;
}

.join-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(1);
}

.join-btn:hover:not(:disabled) {
  background: var(--indigo-500);
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
}

.error-text {
  color: #f87171;
  font-size: 13px;
  font-weight: 500;
  margin-top: 12px;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
}

@media (max-width: 900px) {
  .join-content {
    flex-direction: column;
    align-items: stretch;
  }
  .join-header {
    max-width: none;
  }
  .join-form {
    max-width: none;
  }
}

@media (max-width: 480px) {
  .join-section {
    padding: 24px;
  }
  .join-header {
    gap: 16px;
  }
  .icon-indigo {
    width: 40px;
    height: 40px;
    padding: 8px;
  }
  .header-text h3 {
    font-size: 18px;
  }
  .join-form {
    flex-direction: column;
  }
  .join-btn {
    width: 100%;
  }
}
</style>
