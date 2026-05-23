<script setup>
import { ref, watch } from 'vue';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-vue-next';

const props = defineProps({
  show: { type: Boolean, required: true },
  boardName: { type: String, default: '' },
  loading: { type: Boolean, default: false }
});

const emit = defineEmits(['close', 'confirm']);

// Trap focus inside modal when open
const handleKeydown = (e) => {
  if (e.key === 'Escape' && !props.loading) {
    emit('close');
  }
};

watch(() => props.show, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', handleKeydown);
  } else {
    document.removeEventListener('keydown', handleKeydown);
  }
});
</script>

<template>
  <Transition name="modal-fade">
    <div 
      v-if="show" 
      class="delete-modal-backdrop" 
      @click.self="!loading && emit('close')"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div class="delete-modal glass-panel">
        <!-- Danger Icon -->
        <div class="delete-modal-icon">
          <component :is="AlertTriangle" :size="32" />
        </div>

        <!-- Content -->
        <h3 id="delete-modal-title">¿Eliminar esta retrospectiva?</h3>
        <p class="delete-board-name">{{ boardName }}</p>
        <p class="delete-warning">
          Esta acción es irreversible. Se eliminarán todas las tarjetas y datos asociados.
        </p>

        <!-- Actions -->
        <div class="delete-modal-actions">
          <button 
            @click="emit('close')" 
            :disabled="loading"
            class="glass-btn glass-btn-secondary"
          >
            Cancelar
          </button>
          <button 
            @click="emit('confirm')" 
            :disabled="loading"
            class="glass-btn glass-btn-danger delete-confirm-btn"
          >
            <component :is="loading ? Loader2 : Trash2" :class="['icon-sm', { 'spin-icon': loading }]" />
            <span>{{ loading ? 'Eliminando...' : 'Eliminar' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-active .delete-modal {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
}
.modal-fade-leave-active .delete-modal {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .delete-modal {
  transform: scale(0.9) translateY(10px);
  opacity: 0;
}
.modal-fade-leave-to .delete-modal {
  transform: scale(0.95) translateY(5px);
  opacity: 0;
}

.delete-modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--modal-backdrop);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  padding: 20px;
}

.delete-modal {
  max-width: 420px;
  width: 100%;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  background: var(--modal-bg) !important;
  border-color: var(--modal-border) !important;
}

.delete-modal-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #ef4444;
  margin-bottom: 4px;
}

.delete-modal h3 {
  font-size: 20px;
  font-weight: 700;
}

.delete-board-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

[data-theme="light"] .delete-board-name {
  background: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.06);
}

.delete-warning {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  max-width: 320px;
}

.delete-modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  width: 100%;
  justify-content: center;
}

.delete-confirm-btn {
  min-width: 140px;
  justify-content: center;
}

/* Spinner animation for loading state */
.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
