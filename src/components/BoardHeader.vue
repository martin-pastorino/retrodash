<script setup>
import { ref, watch } from 'vue';
import { 
  ArrowLeft, 
  User, 
  Share2, 
  Clock, 
  Play, 
  XCircle, 
  Eye, 
  Vote, 
  CheckCircle, 
  Settings,
  Sun,
  Moon
} from 'lucide-vue-next';
import { useThemeStore } from '../stores/theme';

const themeStore = useThemeStore();

const props = defineProps({
  board: {
    type: Object,
    required: true
  },
  isCreator: {
    type: Boolean,
    required: true
  },
  formattedTimer: {
    type: String,
    required: true
  },
  remainingTime: {
    type: [Number, null],
    required: true
  },
  graceTimeRemaining: {
    type: [Number, null],
    default: null
  }
});

const emit = defineEmits([
  'back', 
  'update-status', 
  'start-timer', 
  'clear-timer', 
  'toggle-settings',
  'copy-link'
]);

const timerMinutes = ref(15);

// Synchronize timer input with board's configured duration when document loads
watch(() => props.board?.durationMinutes, (newVal) => {
  if (newVal) {
    timerMinutes.value = newVal;
  }
}, { immediate: true });

const handleStartTimer = () => {
  emit('start-timer', timerMinutes.value);
};
</script>

<template>
  <header class="board-header glass-panel">
    <!-- Header Left Area -->
    <div class="header-left">
      <button @click="emit('back')" class="back-btn glass-panel glass-panel-hover" title="Volver al Dashboard">
        <component :is="ArrowLeft" class="icon-md" />
      </button>
      <div class="board-info">
        <h1>{{ board.name }}</h1>
        <div class="board-meta">
          <span class="meta-item">
            <component :is="User" class="icon-xs" />
            <span>Creador: {{ isCreator ? 'Tú' : board.createdByName }}</span>
          </span>
          <span class="meta-item" @click="emit('copy-link')" style="cursor: pointer;" title="Copiar Link de Invitación">
            <component :is="Share2" class="icon-xs" />
            <span>Compartir Link</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Sync Timer Widget -->
    <div class="timer-widget glass-panel">
      <component 
        :is="Clock" 
        class="timer-icon" 
        :class="{ 
          'pulsing': remainingTime !== null && remainingTime < 60,
          'grace-active': graceTimeRemaining !== null && graceTimeRemaining > 0
        }" 
      />
      <span 
        class="timer-display" 
        :class="{ 'grace-text': graceTimeRemaining !== null && graceTimeRemaining > 0 }"
      >
        {{ formattedTimer }}
      </span>
      
      <!-- Creator Timer Controls -->
      <div v-if="isCreator && board.status === 'brainstorm'" class="timer-controls">
        <input 
          v-model="timerMinutes" 
          type="number" 
          min="1" 
          max="60" 
          class="timer-input" 
          v-if="remainingTime === null" 
        />
        <button @click="handleStartTimer" class="timer-btn play-btn" v-if="remainingTime === null" title="Iniciar Timer">
          <component :is="Play" class="icon-xs" />
        </button>
        <button @click="emit('clear-timer')" class="timer-btn stop-btn" v-else title="Cancelar Timer">
          <component :is="XCircle" class="icon-xs" />
        </button>
      </div>
    </div>

    <!-- Session Status Selector (Creator vs Participant badge) -->
    <div class="phase-selector-container">
      <div v-if="isCreator" class="creator-phase-selector glass-panel">
        <button 
          @click="emit('update-status', 'brainstorm')"
          :class="['phase-btn', { active: board.status === 'brainstorm' }]"
          title="Lluvia de Ideas"
        >
          <component :is="Eye" class="icon-sm" />
          <span class="hide-tablet">Lluvia</span>
        </button>
        <button 
          @click="emit('update-status', 'voting')"
          :class="['phase-btn', { active: board.status === 'voting' }]"
          title="Votación"
        >
          <component :is="Vote" class="icon-sm" />
          <span class="hide-tablet">Votar</span>
        </button>
        <button 
          @click="emit('update-status', 'completed')"
          :class="['phase-btn', { active: board.status === 'completed' }]"
          title="Accionables con IA"
        >
          <component :is="CheckCircle" class="icon-sm" />
          <span class="hide-tablet">IA</span>
        </button>
      </div>
      
      <!-- Participant Phase Badge -->
      <div v-else class="participant-phase-badge glass-panel">
        <component 
          :is="board.status === 'brainstorm' ? Eye : board.status === 'voting' ? Vote : CheckCircle" 
          class="icon-sm" 
        />
        <span>
          {{ board.status === 'brainstorm' ? 'Fase: Lluvia de Ideas' : board.status === 'voting' ? 'Fase: Votación Abierta' : 'Fase: Accionables e IA' }}
        </span>
      </div>

      <!-- Theme Toggler -->
      <button @click="themeStore.toggleTheme" class="theme-toggle-btn glass-panel glass-panel-hover" title="Cambiar Tema">
        <component :is="themeStore.theme === 'dark' ? Sun : Moon" class="icon-md" />
      </button>

      <!-- Settings Toggle Button -->
      <button @click="emit('toggle-settings')" class="settings-toggle-btn glass-panel glass-panel-hover" title="Configurar Tablero">
        <component :is="Settings" class="icon-md" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-radius: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  padding: 12px;
  cursor: pointer;
  border-radius: 12px;
  display: flex;
}

.board-info h1 {
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 2px;
}

.board-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.icon-xs {
  width: 12px;
  height: 12px;
}

/* Timer Widget */
.timer-widget {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-radius: 14px;
  background: rgba(255,255,255,0.02);
}

.timer-icon {
  width: 20px;
  height: 20px;
  color: #a5b4fc;
}

.timer-icon.pulsing {
  color: #ef4444;
  animation: pulse-red 1s infinite alternate;
}

.timer-icon.grace-active {
  color: #f59e0b;
  animation: pulse-orange 0.8s infinite alternate ease-in-out;
}

.timer-display.grace-text {
  color: #f59e0b;
  font-weight: 800;
  text-shadow: 0 0 10px rgba(245, 158, 11, 0.25);
}

@keyframes pulse-orange {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.18); opacity: 1; }
}

.timer-display {
  font-family: var(--font-family-title);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-primary);
}

.timer-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  border-left: 1px solid rgba(255,255,255,0.08);
  padding-left: 10px;
}

.timer-input {
  width: 50px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  border-radius: 6px;
  text-align: center;
  padding: 4px;
  font-size: 13px;
  outline: none;
}

.timer-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
}

.timer-btn:hover {
  color: #fff;
}

.timer-btn.play-btn:hover {
  color: #10b981;
}

.timer-btn.stop-btn:hover {
  color: #ef4444;
}

@keyframes pulse-red {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.15); opacity: 1; }
}

/* Phase selector */
.phase-selector-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.creator-phase-selector {
  display: flex;
  padding: 4px;
  border-radius: 12px;
  background: rgba(255,255,255,0.02);
}

.phase-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-family: var(--font-family-title);
  font-weight: 600;
  font-size: 13px;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.phase-btn:hover {
  color: #fff;
  background: rgba(255,255,255,0.04);
}

.phase-btn.active {
  color: #fff;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(236, 72, 153, 0.15) 100%);
  border: 1px solid rgba(99, 102, 241, 0.35);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.participant-phase-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #a5b4fc;
}

.settings-toggle-btn, .theme-toggle-btn {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  padding: 10px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
}

@media (max-width: 900px) {
  .hide-tablet {
    display: none !important;
  }
}
</style>
