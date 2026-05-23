<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Plus } from 'lucide-vue-next';
import RetroCard from './RetroCard.vue';

const props = defineProps({
  column: {
    type: Object,
    required: true
  },
  cards: {
    type: Array,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  currentUser: {
    type: Object,
    required: true
  },
  isCreator: {
    type: Boolean,
    required: true
  },
  canAddCard: {
    type: Boolean,
    default: true
  },
  graceTimeRemaining: {
    type: [Number, null],
    default: null
  },
  isTimerActive: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['add-card', 'delete-card', 'vote-card']);

const cardText = ref('');
const isMobile = ref(false);
const isBottomSheetOpen = ref(false);

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

const placeholderText = computed(() => {
  if (!props.isTimerActive) return '🔒 La lluvia de ideas no ha comenzado...';
  if (!props.canAddCard) return '🔒 El tiempo de escritura ha finalizado por completo.';
  if (props.graceTimeRemaining !== null && props.graceTimeRemaining > 0) return '⏳ ¡Apresúrate! Tiempo de gracia activo...';
  return 'Escribe tu opinión aquí...';
});

const handleAdd = () => {
  const text = cardText.value.trim();
  if (!text) return;
  emit('add-card', text);
  cardText.value = '';
};

const handleSheetSubmit = () => {
  const text = cardText.value.trim();
  if (!text) return;
  emit('add-card', text);
  cardText.value = '';
  isBottomSheetOpen.value = false;
};
</script>

<template>
  <div 
    class="column-lane"
    :class="{ 'mobile-lane': isMobile }"
    :style="{ 
      backgroundColor: isMobile ? 'transparent' : (column.color || 'var(--glass-bg)'), 
      borderColor: isMobile ? 'transparent' : (column.borderColor || 'var(--glass-border)') 
    }"
  >
    <!-- Column Header -->
    <div class="column-header">
      <div class="title-group">
        <h3 class="column-title">{{ column.name }}</h3>
        <span class="cards-count-badge">{{ cards.length }} tarjetas</span>
      </div>
    </div>

    <!-- Add Card Textarea Form (Brainstorm only, desktop inline) -->
    <div v-if="status === 'brainstorm' && !isMobile" class="add-card-container">
      <textarea 
        v-model="cardText" 
        :placeholder="placeholderText" 
        class="glass-input card-textarea"
        rows="2"
        :disabled="!canAddCard"
        @keyup.enter.exact.prevent="handleAdd"
      ></textarea>
      <button @click="handleAdd" class="glass-btn add-card-btn" title="Agregar Tarjeta" :disabled="!canAddCard">
        <component :is="Plus" class="icon-sm" />
        <span>Agregar</span>
      </button>
    </div>

    <!-- Mobile-First Bottom Sheet Trigger Button -->
    <button 
      v-if="status === 'brainstorm' && isMobile" 
      @click="isBottomSheetOpen = true" 
      class="glass-btn add-card-trigger-btn"
      :style="{ background: column.borderColor || 'var(--indigo-600)', color: '#fff' }"
      :disabled="!canAddCard"
    >
      <component :is="Plus" class="icon-sm" />
      <span>Agregar Idea</span>
    </button>

    <!-- Cards Stack inside Lane -->
    <div class="cards-stack">
      <TransitionGroup name="cards-list">
        <RetroCard 
          v-for="card in cards" 
          :key="card.id" 
          :card="card"
          :board-status="status"
          :current-user="currentUser"
          :is-creator="isCreator"
          @delete="emit('delete-card', card.id)"
          @vote="emit('vote-card', card.id)"
        />
      </TransitionGroup>
    </div>

    <!-- Mobile Bottom Sheet Form -->
    <Teleport to="body">
      <div 
        v-if="isMobile && isBottomSheetOpen" 
        class="bottom-sheet-backdrop" 
        @click.self="isBottomSheetOpen = false"
      >
        <div class="bottom-sheet-content glass-panel animate-slide-up">
          <div class="bottom-sheet-header">
            <span class="sheet-indicator"></span>
            <h4>Nueva Idea en <span :style="{ color: column.borderColor || '#6366f1' }">{{ column.name }}</span></h4>
            <button @click="isBottomSheetOpen = false" class="close-sheet-btn">&times;</button>
          </div>
          <div class="bottom-sheet-body">
            <textarea 
              v-model="cardText" 
              :placeholder="placeholderText" 
              class="glass-input sheet-textarea"
              rows="4"
              autofocus
              :disabled="!canAddCard"
            ></textarea>
            <div class="sheet-actions">
              <button @click="isBottomSheetOpen = false" class="glass-btn glass-btn-secondary">Cancelar</button>
              <button @click="handleSheetSubmit" class="glass-btn glass-btn-primary" :disabled="!canAddCard">
                <component :is="Plus" class="icon-sm" />
                <span>Agregar al Tablero</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.column-lane {
  border-radius: 18px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 480px;
  border: 1px solid var(--glass-border);
  transition: all 0.3s ease;
}

.column-lane.mobile-lane {
  padding: 16px;
  min-height: auto;
  border: none;
  background: transparent !important;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 12px;
}

.mobile-lane .column-header {
  border-bottom-color: rgba(255,255,255,0.1);
  margin-bottom: 8px;
}

.title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.column-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.cards-count-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  opacity: 0.8;
}

/* Add Card elements */
.add-card-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-textarea {
  background: rgba(4, 6, 12, 0.3);
  border: 1px solid rgba(255,255,255,0.06);
  padding: 10px 12px;
  font-size: 13px;
  resize: none;
  border-radius: 10px;
  line-height: 1.4;
}

.add-card-btn {
  justify-content: center;
  padding: 8px 16px;
  font-size: 12px;
}

/* Cards stack */
.cards-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.mobile-lane .cards-stack {
  gap: 16px;
  padding-bottom: 100px; /* Space for the floating button or scroll */
}

/* Bottom Sheet Backdrop */
.bottom-sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(4, 6, 12, 0.7);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

/* Bottom Sheet Content */
.bottom-sheet-content {
  background: #0f172a; /* Solid dark for better mobile contrast */
  border-top: 1px solid rgba(255,255,255,0.1);
  border-radius: 28px 28px 0 0;
  padding: 24px 24px 40px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 0 -12px 40px rgba(0,0,0,0.5);
}

.animate-slide-up {
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.bottom-sheet-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  gap: 12px;
  padding-bottom: 8px;
}

.sheet-indicator {
  width: 36px;
  height: 5px;
  background: rgba(255,255,255,0.15);
  border-radius: 10px;
}

.bottom-sheet-header h4 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
}

.close-sheet-btn {
  position: absolute;
  right: -8px;
  top: 0;
  background: rgba(255,255,255,0.05);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--text-secondary);
  cursor: pointer;
}

.bottom-sheet-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sheet-textarea {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255,255,255,0.1);
  font-size: 16px; /* Avoid auto-zoom on iOS */
  padding: 16px;
  border-radius: 16px;
  resize: none;
  color: var(--text-primary);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
}

.sheet-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.sheet-actions button {
  height: 52px;
  font-weight: 700;
  border-radius: 14px;
}

.add-card-trigger-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  left: 24px;
  z-index: 500;
  height: 56px;
  justify-content: center;
  padding: 0 24px;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 12px 24px rgba(0,0,0,0.3);
  border: none;
}

/* --- Cards Elastic List Transitions (Vue TransitionGroup) --- */
.cards-list-enter-active,
.cards-list-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.cards-list-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.95);
}

.cards-list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Animación elástica de reordenamiento de tarjetas en swaps */
.cards-list-move {
  transition: transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Eliminar del flujo normal al salir para no entorpecer el movimiento */
.cards-list-leave-active {
  position: absolute;
  width: 100%;
}
</style>
