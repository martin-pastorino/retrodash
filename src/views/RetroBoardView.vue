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
    transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
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

// Format timer text
const formattedTimer = computed(() => {
  if (remainingTime.value === null || remainingTime.value < 0) return '00:00';
  const mins = Math.floor(remainingTime.value / 60);
  const secs = remainingTime.value % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
});

// Watch timer expiration and sync
watch(() => boardStore.activeBoard?.timerExpiresAt, (newExpiresAt) => {
  clearInterval(timerInterval.value);
  
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
      clearInterval(timerInterval.value);
    } else {
      remainingTime.value = difference;
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
        @back="router.push('/')"
        @update-status="handleUpdateStatus"
        @start-timer="handleStartTimer"
        @clear-timer="handleClearTimer"
        @toggle-settings="showSettingsModal = true"
        @copy-link="copyInviteLink"
      />

      <!-- Brainstorm Warning Banner -->
      <div v-if="boardStore.activeBoard.status === 'brainstorm' && remainingTime === 0" class="timer-warning-banner glass-panel">
        <span>⏱️ ¡El tiempo de lluvia de ideas ha terminado! Esperando a que el moderador active la fase de votación.</span>
      </div>

      <!-- Main Board Content -->
      <div class="board-body-container">
        
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
        <div v-if="isMobile" class="mobile-lanes-nav glass-panel">
          <button 
            v-for="(col, index) in columns" 
            :key="col.id"
            class="mobile-lane-tab"
            :class="{ active: activeMobileColumnIndex === index }"
            @click="activeMobileColumnIndex = index"
          >
            <span class="tab-name">{{ col.name }}</span>
            <span class="tab-count-badge">{{ cardsByColumn[col.id]?.length || 0 }}</span>
          </button>
        </div>

        <!-- Columns lanes grid Orchestration -->
        <div 
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
  padding: 8px;
  border-radius: 14px;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none; /* hide scrollbars */
  -webkit-overflow-scrolling: touch;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.mobile-lanes-nav::-webkit-scrollbar {
  display: none;
}

.mobile-lane-tab {
  flex: 1;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
  color: var(--text-secondary);
  font-family: var(--font-family-body);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-lane-tab.active {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tab-count-badge {
  font-size: 10px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.12);
  padding: 2px 6px;
  border-radius: 8px;
  color: var(--text-primary);
}

.mobile-lane-tab.active .tab-count-badge {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
}

/* Responsiveness overrides for columns flex grid */
@media (max-width: 768px) {
  .board-body-container {
    overflow: hidden; /* Prevent horizontal page scroll during swipes */
    width: 100%;
  }

  .board-columns-grid {
    display: flex !important;
    gap: 0 !important;
    padding: 4px 0;
  }

  .column-lane-wrapper {
    padding: 0 4px; /* Slight lateral margins */
  }
}
</style>
