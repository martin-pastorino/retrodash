<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
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
    class="column-lane glass-panel"
    :style="{ 
      backgroundColor: column.color || 'var(--glass-bg)', 
      borderColor: column.borderColor || 'var(--glass-border)' 
    }"
  >
    <!-- Column Header -->
    <div class="column-header">
      <h3 class="column-title">{{ column.name }}</h3>
      <span class="cards-count-badge">{{ cards.length }}</span>
    </div>

    <!-- Add Card Textarea Form (Brainstorm only, desktop inline) -->
    <div v-if="status === 'brainstorm' && !isMobile" class="add-card-container">
      <textarea 
        v-model="cardText" 
        placeholder="Escribe tu opinión aquí..." 
        class="glass-input card-textarea"
        rows="2"
        @keyup.enter.exact.prevent="handleAdd"
      ></textarea>
      <button @click="handleAdd" class="glass-btn add-card-btn" title="Agregar Tarjeta">
        <component :is="Plus" class="icon-sm" />
        <span>Agregar</span>
      </button>
    </div>

    <!-- Mobile-First Bottom Sheet Trigger Button -->
    <button 
      v-if="status === 'brainstorm' && isMobile" 
      @click="isBottomSheetOpen = true" 
      class="glass-btn add-card-trigger-btn"
      :style="{ borderColor: column.borderColor || 'rgba(255,255,255,0.1)' }"
    >
      <component :is="Plus" class="icon-sm" />
      <span>Escribir Idea</span>
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
              placeholder="Escribe tu opinión aquí..." 
              class="glass-input sheet-textarea"
              rows="4"
              autofocus
            ></textarea>
            <div class="sheet-actions">
              <button @click="isBottomSheetOpen = false" class="glass-btn glass-btn-secondary">Cancelar</button>
              <button @click="handleSheetSubmit" class="glass-btn glass-btn-primary">
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
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 12px;
}

.column-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.cards-count-badge {
  font-size: 12px;
  font-weight: 600;
  background: rgba(255,255,255,0.08);
  padding: 2px 8px;
  border-radius: 10px;
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

/* Bottom Sheet Backdrop */
.bottom-sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(4, 6, 12, 0.6);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

/* Bottom Sheet Content */
.bottom-sheet-content {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border-top: 1px solid var(--glass-border);
  border-radius: 24px 24px 0 0;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 0 -8px 32px rgba(0,0,0,0.3);
}

.animate-slide-up {
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
  width: 40px;
  height: 4px;
  background: rgba(255,255,255,0.2);
  border-radius: 2px;
}

.bottom-sheet-header h4 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
}

.close-sheet-btn {
  position: absolute;
  right: 0;
  top: 4px;
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-secondary);
  cursor: pointer;
}

.bottom-sheet-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sheet-textarea {
  background: rgba(4, 6, 12, 0.4);
  border: 1px solid rgba(255,255,255,0.08);
  font-size: 14px;
  padding: 14px;
  border-radius: 12px;
  resize: none;
  color: var(--text-primary);
}

.sheet-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.sheet-actions button {
  flex: 1;
}

.add-card-trigger-btn {
  width: 100%;
  justify-content: center;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
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
