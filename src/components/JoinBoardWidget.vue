<script setup>
import { ref } from 'vue';
import { Lock, ChevronRight } from 'lucide-vue-next';

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
    <div class="join-header">
      <component :is="Lock" class="icon-indigo" />
      <div>
        <h3>¿Tienes un código de acceso?</h3>
        <p>Introduce el ID del tablero para sumarte a la retrospectiva en tiempo real.</p>
      </div>
    </div>
    
    <div class="join-form">
      <input 
        v-model="boardCodeInput" 
        type="text" 
        placeholder="Introduce el ID del tablero..." 
        class="glass-input join-input"
        @keyup.enter="handleJoin"
      />
      <button @click="handleJoin" class="glass-btn join-btn">
        <span>Unirse</span>
        <component :is="ChevronRight" class="icon-sm" />
      </button>
    </div>
    <p v-if="joinError" class="error-text">{{ joinError }}</p>
  </div>
</template>

<style scoped>
.join-section {
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
}

.join-header {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 480px;
}

.icon-indigo {
  width: 40px;
  height: 40px;
  color: #818cf8;
  background: rgba(99, 102, 241, 0.15);
  padding: 8px;
  border-radius: 12px;
  border: 1px solid rgba(99, 102, 241, 0.25);
}

.join-header h3 {
  font-size: 18px;
  margin-bottom: 4px;
}

.join-header p {
  font-size: 13px;
  color: var(--text-secondary);
}

.join-form {
  display: flex;
  gap: 12px;
  flex: 1;
  max-width: 420px;
}

.join-input {
  flex: 1;
}

.join-btn {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  padding: 12px 20px;
}

.join-btn:hover {
  background: rgba(255,255,255,0.12);
  border-color: rgba(255,255,255,0.25);
  box-shadow: 0 0 15px rgba(255,255,255,0.08);
}

.error-text {
  color: var(--text-error);
  font-size: 12px;
  margin-top: 8px;
  width: 100%;
}

@media (max-width: 768px) {
  .join-section {
    flex-direction: column;
    align-items: stretch;
  }
  .join-form {
    max-width: none;
  }
}
</style>
