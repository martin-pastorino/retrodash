<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useBoardStore } from '../stores/board';
import { geminiService } from '../services/gemini';

// Lucide Icons
import { Lock, ArrowLeft } from 'lucide-vue-next';

// Extracted Sub-Components
import BoardHeader from '../components/BoardHeader.vue';
import SettingsModal from '../components/SettingsModal.vue';
import AiActionables from '../components/AiActionables.vue';
import ColumnLane from '../components/ColumnLane.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const boardStore = useBoardStore();

const boardId = route.params.id;

// UI Local States
const remainingTime = ref(null);
const graceTimeRemaining = ref(null);
const timerInterval = ref(null);
const showSettingsModal = ref(false);
const isGeneratingAi = ref(false);
const aiError = ref('');
const isCopied = ref(false);

// Mobile Responsive & Swipe States
const isMobile = ref(false);
const activeMobileColumnIndex = ref(0);
const touchStartX = ref(0);
const touchStartY = ref(0);

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

// Touch gestures handlers
const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX;
  touchStartY.value = e.touches[0].clientY;
};

const handleTouchEnd = (e) => {
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  
  const diffX = touchEndX - touchStartX.value;
  const diffY = touchEndY - touchStartY.value;
  
  // Swipe detection threshold: horizontal swipe greater than vertical & > 50px
  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
    if (diffX > 0) {
      // Swiped right -> previous lane
      if (activeMobileColumnIndex.value > 0) {
        activeMobileColumnIndex.value--;
      }
    } else {
      // Swiped left -> next lane
      if (activeMobileColumnIndex.value < columns.value.length - 1) {
        activeMobileColumnIndex.value++;
      }
    }
  }
};

const mobileGridStyle = computed(() => {
  if (!isMobile.value) return {};
  return {
    display: 'flex',
    width: `${columns.value.length * 100}%`,
    transform: `translateX(-${(activeMobileColumnIndex.value * 100) / columns.value.length}%)`,
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
  };
});

const mobileColumnStyle = computed(() => {
  if (!isMobile.value) return {};
  return {
    flex: `0 0 ${100 / columns.value.length}%`,
    width: `${100 / columns.value.length}%`,
    boxSizing: 'border-box'
  };
});

// Subscribe on mount
onMounted(() => {
  boardStore.subscribeToBoard(boardId);
  boardStore.subscribeToCards(boardId);
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

// Unsubscribe on unmount
onUnmounted(() => {
  boardStore.unsubscribeAll();
  clearInterval(timerInterval.value);
  window.removeEventListener('resize', checkMobile);
});

// Current authenticated user
const currentUser = computed(() => authStore.user);

// Check if user is the board creator
const isCreator = computed(() => {
  return boardStore.activeBoard?.createdBy === currentUser.value?.uid;
});

// Check if user has permission to view this board
const hasAccess = computed(() => {
  const board = boardStore.activeBoard;
  if (!board) return false;
  
  // If participants is empty, open access
  if (!board.participants || board.participants.length === 0) return true;
  
  // Otherwise, user's email must be listed in participants
  return board.participants.includes(currentUser.value?.email?.toLowerCase());
});

// Synced columns from Firestore
const columns = computed(() => {
  return boardStore.activeBoard?.columns || [];
});

// Group cards by columnId
const cardsByColumn = computed(() => {
  const grouped = {};
  columns.value.forEach(col => {
    grouped[col.id] = [];
  });
  
  boardStore.activeCards.forEach(card => {
    if (grouped[card.columnId]) {
      grouped[card.columnId].push(card);
    }
  });

  // Sort each column's cards by votes length (highest first) in voting & completed phases
  if (boardStore.activeBoard?.status !== 'brainstorm') {
    Object.keys(grouped).forEach(colId => {
      grouped[colId].sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));
    });
  }

  return grouped;
});

// Check if the timer has been started
const isTimerActive = computed(() => {
  return !!boardStore.activeBoard?.timerStartedAt && !!boardStore.activeBoard?.timerExpiresAt;
});

// Check if writing is enabled
const canAddCard = computed(() => {
  if (boardStore.activeBoard?.status !== 'brainstorm') return false;
  if (!isTimerActive.value) return false;
  
  const expiresAt = boardStore.activeBoard?.timerExpiresAt;
  if (!expiresAt) return false;
  
  const expires = new Date(expiresAt).getTime();
  const now = new Date().getTime();
  
  // Can write if timer is running OR we are in the 30 seconds grace period
  return now < expires || (now >= expires && now < (expires + 30000));
});

// Format timer text (handles standard timer and grace period countdown)
const formattedTimer = computed(() => {
  if (!isTimerActive.value) return '00:00';
  
  if (remainingTime.value !== null && remainingTime.value > 0) {
    const mins = Math.floor(remainingTime.value / 60);
    const secs = remainingTime.value % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  if (graceTimeRemaining.value !== null && graceTimeRemaining.value > 0) {
    return `-${graceTimeRemaining.value}s`;
  }
  
  return '00:00';
});

// Watch timer expiration, countdown logic, and grace window
watch(() => boardStore.activeBoard?.timerExpiresAt, (newExpiresAt) => {
  clearInterval(timerInterval.value);
  graceTimeRemaining.value = null;
  
  if (!newExpiresAt) {
    remainingTime.value = null;
    return;
  }

  const updateCountdown = () => {
    const expires = new Date(newExpiresAt).getTime();
    const now = new Date().getTime();
    const difference = Math.floor((expires - now) / 1000);
    
    if (difference <= 0) {
      remainingTime.value = 0;
      
      // Calculate grace period countdown (30s window)
      const graceExpires = expires + 30 * 1000;
      const graceDifference = Math.floor((graceExpires - now) / 1000);
      
      if (graceDifference <= 0) {
        graceTimeRemaining.value = 0;
        clearInterval(timerInterval.value);
      } else {
        graceTimeRemaining.value = graceDifference;
      }
    } else {
      remainingTime.value = difference;
      graceTimeRemaining.value = null;
    }
  };

  updateCountdown();
  timerInterval.value = setInterval(updateCountdown, 1000);
}, { immediate: true });

// Actions implementation
const handleAddCard = async (colId, text) => {
  try {
    await boardStore.addCard(boardId, colId, text, currentUser.value);
  } catch (error) {
    console.error('Error adding card:', error);
  }
};

const handleDeleteCard = async (cardId) => {
  if (!confirm('¿Estás seguro de eliminar esta tarjeta?')) return;
  try {
    await boardStore.deleteCard(boardId, cardId);
  } catch (error) {
    console.error('Error deleting card:', error);
  }
};

const handleVoteCard = async (cardId) => {
  if (boardStore.activeBoard?.status !== 'voting') return;
  try {
    await boardStore.toggleVote(boardId, cardId, currentUser.value.uid);
  } catch (error) {
    console.error('Error voting for card:', error);
  }
};

const handleUpdateStatus = async (status) => {
  if (!isCreator.value) return;
  try {
    await boardStore.updateBoardStatus(boardId, status);
  } catch (error) {
    console.error('Error updating status:', error);
  }
};

const handleStartTimer = async (minutes) => {
  if (!isCreator.value) return;
  try {
    await boardStore.startBoardTimer(boardId, minutes);
  } catch (error) {
    console.error('Error starting timer:', error);
  }
};

const handleClearTimer = async () => {
  if (!isCreator.value) return;
  try {
    await boardStore.clearBoardTimer(boardId);
  } catch (error) {
    console.error('Error clearing timer:', error);
  }
};

// Copy invite details
const copyInviteLink = () => {
  const url = window.location.href;
  navigator.clipboard.writeText(url);
  isCopied.value = true;
  setTimeout(() => isCopied.value = false, 2000);
};

// Custom column additions in Settings
const handleAddColumn = async (newCol) => {
  if (!isCreator.value) return;
  const rgb = hexToRgb(newCol.color);
  const updatedColumns = [...columns.value, {
    id: 'col_' + Date.now(),
    name: newCol.name,
    color: newCol.color,
    borderColor: newCol.borderColor
  }];
  await boardStore.updateBoardColumns(boardId, updatedColumns);
};

const handleRemoveColumn = async (colId) => {
  if (!isCreator.value || columns.value.length <= 1) return;
  if (!confirm('Al eliminar la columna, también eliminarás todas las tarjetas creadas en ella. ¿Continuar?')) return;
  
  const updatedColumns = columns.value.filter(c => c.id !== colId);
  await boardStore.updateBoardColumns(boardId, updatedColumns);
};

// Save local api keys
const handleSaveApiKey = (key) => {
  if (key) {
    localStorage.setItem('RETRODASH_GEMINI_KEY', key);
  }
};

// Gemini AI actionables extraction
const generateAiActionables = async () => {
  const apiKey = localStorage.getItem('RETRODASH_GEMINI_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    aiError.value = 'Por favor, ingresa una Gemini API Key en la configuración para utilizar esta función.';
    showSettingsModal.value = true;
    return;
  }

  isGeneratingAi.value = true;
  aiError.value = '';

  try {
    const analysis = await geminiService.generateRetroActionables(
      boardStore.activeCards,
      columns.value,
      apiKey
    );
    
    // Save generated fields on Firestore board document
    await boardStore.saveAiAnalysis(boardId, {
      moodSummary: analysis.moodSummary,
      moodEmoji: analysis.moodEmoji,
      actionItems: analysis.actionItems
    });
  } catch (error) {
    console.error('Error generating AI actionables:', error);
    aiError.value = error.message || 'Ocurrió un error al procesar con IA. Verifica tu API Key y conexión.';
  } finally {
    isGeneratingAi.value = false;
  }
};

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 255, 255';
}
</script>

<template>
  <div class="retro-board-view" v-if="boardStore.activeBoard">
    <!-- Access Denied Screen -->
    <div v-if="!hasAccess" class="denied-container">
      <div class="denied-card glass-panel">
        <component :is="Lock" class="denied-icon" />
        <h2>Acceso Restringido</h2>
        <p>No tienes permiso para unirte a esta retrospectiva. Esta sesión está limitada a participantes específicos.</p>
        <button @click="router.push('/')" class="glass-btn glass-btn-secondary">
          <component :is="ArrowLeft" class="icon-sm" />
          <span>Volver al Dashboard</span>
        </button>
      </div>
    </div>

    <!-- Active Board Screen -->
    <template v-else>
      <!-- Sub-Navbar / Extracted Header Component -->
      <BoardHeader 
        :board="boardStore.activeBoard"
        :is-creator="isCreator"
        :formatted-timer="formattedTimer"
        :remaining-time="remainingTime"
        :grace-time-remaining="graceTimeRemaining"
        @back="router.push('/')"
        @update-status="handleUpdateStatus"
        @start-timer="handleStartTimer"
        @clear-timer="handleClearTimer"
        @toggle-settings="showSettingsModal = true"
        @copy-link="copyInviteLink"
      />

      <!-- Dynamic Agile Timer Warning Banners (World-Class UX) -->
      <div v-if="boardStore.activeBoard.status === 'brainstorm'" class="timer-banners-container">
        <!-- 1. Timer not started yet -->
        <div v-if="!isTimerActive" class="timer-info-banner glass-panel">
          <span>🔒 La lluvia de ideas aún no ha comenzado. El moderador debe iniciar el temporizador para habilitar la escritura.</span>
        </div>
        
        <!-- 2. Grace Period Active -->
        <div v-else-if="remainingTime === 0 && graceTimeRemaining > 0" class="timer-grace-banner glass-panel">
          <span class="grace-pulse">⏳ ¡Tiempo de gracia activo! Te quedan <strong>{{ graceTimeRemaining }} segundos</strong> para terminar y enviar tus ideas en curso.</span>
        </div>
        
        <!-- 3. Timer & Grace Period completely expired -->
        <div v-else-if="remainingTime === 0 && graceTimeRemaining === 0" class="timer-locked-banner glass-panel">
          <span>🔒 El tiempo para agregar comentarios ha finalizado por completo. Esperando la fase de votación.</span>
        </div>
      </div>

      <!-- Main Board Content -->
      <div class="board-body-container" :class="{ 'mobile-mode': isMobile }">
        
        <!-- AI Actionables Extracted Component -->
        <AiActionables 
          v-if="boardStore.activeBoard.status === 'completed'"
          :action-items="boardStore.activeBoard.actionItems || []"
          :mood-summary="boardStore.activeBoard.moodSummary || ''"
          :mood-emoji="boardStore.activeBoard.moodEmoji || ''"
          :is-creator="isCreator"
          :is-generating="isGeneratingAi"
          :error="aiError"
          @generate="generateAiActionables"
        />

        <!-- Mobile-First Swipe Navigation Tabs -->
        <div v-if="isMobile && boardStore.activeBoard.status !== 'completed'" class="mobile-lanes-nav glass-panel">
          <button 
            v-for="(col, index) in columns" 
            :key="col.id"
            class="mobile-lane-tab"
            :class="{ active: activeMobileColumnIndex === index }"
            @click="activeMobileColumnIndex = index"
          >
            <span class="tab-emoji">{{ col.name.split(' ')[0] }}</span>
            <span class="tab-name">{{ col.name.split(' ').slice(1).join(' ') || col.name }}</span>
            <span class="tab-count-badge">{{ cardsByColumn[col.id]?.length || 0 }}</span>
          </button>
        </div>

        <!-- Columns lanes grid Orchestration -->
        <div 
          v-if="boardStore.activeBoard.status !== 'completed'"
          class="board-columns-grid"
          :style="mobileGridStyle"
          @touchstart="handleTouchStart"
          @touchend="handleTouchEnd"
        >
          <div 
            v-for="col in columns" 
            :key="col.id"
            class="column-lane-wrapper"
            :style="mobileColumnStyle"
          >
            <ColumnLane 
              :column="col"
              :cards="cardsByColumn[col.id] || []"
              :status="boardStore.activeBoard.status"
              :current-user="currentUser"
              :is-creator="isCreator"
              :can-add-card="canAddCard"
              :grace-time-remaining="graceTimeRemaining"
              :is-timer-active="isTimerActive"
              @add-card="(text) => handleAddCard(col.id, text)"
              @delete-card="handleDeleteCard"
              @vote-card="handleVoteCard"
            />
          </div>
        </div>
      </div>

      <!-- Settings Extracted Modal Component -->
      <SettingsModal 
        :show="showSettingsModal"
        :is-creator="isCreator"
        :board-id="boardId"
        :columns="columns"
        :is-copied="isCopied"
        @close="showSettingsModal = false"
        @save-api-key="handleSaveApiKey"
        @add-column="handleAddColumn"
        @remove-column="handleRemoveColumn"
        @copy-link="copyInviteLink"
      />
    </template>
  </div>

  <!-- Loading / Empty Board Screen -->
  <div v-else class="retro-board-loading">
    <span class="spinner-pulse"></span>
    <p>Conectando al tablero de retrospectiva en tiempo real...</p>
  </div>
</template>

<style scoped>
.retro-board-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 20px;
}

/* Warnings */
.timer-warning-banner {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.25);
  color: #fef08a;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

/* Layout for Board lanes */
.board-body-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.board-columns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  align-items: flex-start;
}

/* Preloading Screen */
.retro-board-loading {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  color: var(--text-secondary);
}

.denied-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
}

.denied-card {
  max-width: 420px;
  text-align: center;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.denied-icon {
  width: 50px;
  height: 50px;
  color: #ef4444;
}

/* Mobile Swipe Navigation Tabs styling */
.mobile-lanes-nav {
  display: flex;
  padding: 6px;
  border-radius: 16px;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: -8px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.mobile-lanes-nav::-webkit-scrollbar {
  display: none;
}

.mobile-lane-tab {
  flex: 1;
  min-width: 90px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 8px;
  background: transparent;
  border: none;
  border-radius: 12px;
  color: var(--text-secondary);
  font-family: var(--font-family-body);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.tab-emoji {
  font-size: 18px;
  opacity: 0.7;
}

.tab-name {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.mobile-lane-tab.active {
  background: rgba(99, 102, 241, 0.12);
  color: var(--text-primary);
}

.mobile-lane-tab.active .tab-emoji {
  opacity: 1;
  transform: scale(1.1);
}

.tab-count-badge {
  position: absolute;
  top: 4px;
  right: 8px;
  font-size: 9px;
  font-weight: 800;
  background: rgba(255, 255, 255, 0.1);
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.mobile-lane-tab.active .tab-count-badge {
  background: var(--indigo-600);
  color: white;
}

/* Responsiveness overrides for columns flex grid */
@media (max-width: 768px) {
  .retro-board-view {
    padding: 12px 0 0 0; /* Remove lateral padding for full-bleed */
    gap: 12px;
  }

  .board-body-container.mobile-mode {
    overflow: hidden;
    width: 100%;
    padding: 0;
  }

  .board-columns-grid {
    display: flex !important;
    gap: 0 !important;
    padding: 0;
  }

  .column-lane-wrapper {
    padding: 0; /* Full-bleed cards */
  }

  /* Adjust banners for mobile */
  .timer-banners-container {
    padding: 0 16px;
  }
}

/* --- Agile Timer Warning Banners System (WOW Design) --- */
.timer-banners-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.timer-info-banner,
.timer-grace-banner,
.timer-locked-banner {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.35s ease;
}

/* Info: Timer not started */
.timer-info-banner {
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.2);
  color: #c7d2fe;
}

/* Grace Period: Active 30s countdown */
.timer-grace-banner {
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.35);
  color: #fef08a;
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.1);
}

.grace-pulse {
  animation: pulse-light-orange 1.2s infinite alternate ease-in-out;
}

@keyframes pulse-light-orange {
  0% { opacity: 0.85; }
  100% { opacity: 1; transform: scale(1.005); }
}

/* Locked: Completely ended */
.timer-locked-banner {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.22);
  color: #fca5a5;
}

/* Light Theme Contrast overrides for Banners */
[data-theme="light"] {
  .timer-info-banner {
    background: rgba(79, 70, 229, 0.05) !important;
    border-color: rgba(79, 70, 229, 0.2) !important;
    color: #312e81 !important;
  }
  .timer-grace-banner {
    background: rgba(217, 119, 6, 0.05) !important;
    border-color: rgba(217, 119, 6, 0.25) !important;
    color: #78350f !important;
  }
  .timer-locked-banner {
    background: rgba(220, 38, 38, 0.04) !important;
    border-color: rgba(220, 38, 38, 0.2) !important;
    color: #7f1d1d !important;
  }
}
</style>
