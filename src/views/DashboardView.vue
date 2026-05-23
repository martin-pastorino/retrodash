<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useBoardStore } from '../stores/board';
import { notifications } from '../services/notifications';

// Lucide Icons
import { 
  LogOut, 
  Plus, 
  Layout, 
  Sparkles,
  Sun,
  Moon
} from 'lucide-vue-next';
import { useThemeStore } from '../stores/theme';

// Extracted Sub-Components
import JoinBoardWidget from '../components/JoinBoardWidget.vue';
import BoardCard from '../components/BoardCard.vue';
import CreateBoardModal from '../components/CreateBoardModal.vue';

const authStore = useAuthStore();
const boardStore = useBoardStore();
const themeStore = useThemeStore();
const router = useRouter();

// Subscriptions
let boardsUnsubscribe = null;

// Modal Trigger State
const showCreateModal = ref(false);

onMounted(async () => {
  if (authStore.user) {
    boardsUnsubscribe = boardStore.fetchUserBoards(authStore.user.email, authStore.user.uid);
    // Request permission for push notifications
    await notifications.requestPermission();
  }
});

onUnmounted(() => {
  if (boardsUnsubscribe) boardsUnsubscribe();
});

// Schedule notifications when boards load/update
watch(
  () => boardStore.boardsList,
  (newList) => {
    newList.forEach((board) => {
      // Only schedule if board status is brainstorm or voting, and has scheduledAt
      if (board.status !== 'completed' && board.scheduledAt) {
        notifications.schedule(board);
      }
    });
  },
  { deep: true }
);

const handleLogout = async () => {
  try {
    notifications.cancelAll(); // Clean up notifications on logout
    await authStore.logout();
    router.push({ name: 'login' });
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

// Create board action handler (passed to CreateBoardModal)
const handleCreateBoard = async (formData, setErrorCallback) => {
  try {
    const boardId = await boardStore.createBoard(
      formData.name,
      formData.duration,
      formData.participants,
      formData.columns,
      authStore.user,
      formData.scheduledAt
    );
    showCreateModal.value = false;
    router.push({ name: 'retro', params: { id: boardId } });
  } catch (error) {
    console.error('Error creating board:', error);
    setErrorCallback(error.message || 'Error al conectar con Firestore.');
  }
};

// Join existing board action handler (passed to JoinBoardWidget)
const handleJoinBoard = async (boardId, setErrorCallback) => {
  try {
    router.push({ name: 'retro', params: { id: boardId } });
  } catch (error) {
    setErrorCallback('Código de tablero inválido o no tienes permisos.');
  }
};
</script>

<template>
  <div class="dashboard-view">
    <!-- Navigation Bar -->
    <header class="navbar glass-panel">
      <div class="nav-brand">
        <span class="nav-logo">✨</span>
        <span class="nav-title">RetroDash</span>
      </div>

      <div class="user-profile" v-if="authStore.user">
        <div class="user-avatar-container">
          <img :src="authStore.user.photoURL" :alt="authStore.user.displayName" class="user-avatar" />
          <div class="glow-ring"></div>
        </div>
        <div class="user-meta hide-mobile">
          <span class="user-name">{{ authStore.user.displayName }}</span>
          <span class="user-email">{{ authStore.user.email }}</span>
        </div>
        <button @click="themeStore.toggleTheme" class="glass-btn glass-btn-secondary theme-toggle-btn" title="Cambiar Tema" style="padding: 10px; display: flex;">
          <component :is="themeStore.theme === 'dark' ? Sun : Moon" class="icon-sm" />
        </button>
        <button @click="handleLogout" class="glass-btn glass-btn-secondary logout-btn" title="Cerrar Sesión">
          <component :is="LogOut" class="icon-sm" />
          <span class="hide-mobile">Salir</span>
        </button>
      </div>
    </header>

    <!-- Main Workspace -->
    <main class="dashboard-container">
      
      <!-- Welcome Header -->
      <section class="welcome-section">
        <div class="welcome-text">
          <h1>Hola, {{ authStore.user?.displayName.split(' ')[0] || 'Martin' }} 👋</h1>
          <p>Organiza retrospectivas eficaces y obtén accionables automáticos.</p>
        </div>
        <div class="welcome-actions">
          <button @click="showCreateModal = true" class="glass-btn glass-btn-primary action-btn">
            <component :is="Plus" class="icon-md" />
            <span>Crear Nueva Retro</span>
          </button>
        </div>
      </section>

      <!-- Quick Action: Join Board Extracted Widget -->
      <JoinBoardWidget @join="handleJoinBoard" />

      <!-- Retrospectives List Section -->
      <section class="retros-list-section">
        <div class="section-title">
          <component :is="Layout" class="icon-purple" />
          <h2>Tus Tableros de Retrospectiva</h2>
        </div>

        <!-- Empty State -->
        <div v-if="boardStore.boardsList.length === 0 && !boardStore.loadingBoards" class="empty-state glass-panel">
          <div class="empty-icon">📂</div>
          <h3>No tienes tableros activos</h3>
          <p>Los tableros que crees o a los que te inviten aparecerán aquí en tiempo real.</p>
          <button @click="showCreateModal = true" class="glass-btn glass-btn-secondary">
            <span>Crear mi primer tablero</span>
          </button>
        </div>

        <!-- Loading State -->
        <div v-else-if="boardStore.loadingBoards" class="loading-boards">
          <span class="spinner-pulse"></span>
          <p>Sincronizando tableros...</p>
        </div>

        <!-- Grid of Boards Extracted Cards -->
        <div v-else class="boards-grid">
          <BoardCard 
            v-for="board in boardStore.boardsList" 
            :key="board.id" 
            :board="board"
            @click="router.push({ name: 'retro', params: { id: board.id } })"
          />
        </div>
      </section>

    </main>

    <!-- Create Board Extracted Modal -->
    <CreateBoardModal 
      :show="showCreateModal" 
      @close="showCreateModal = false"
      @create="handleCreateBoard"
    />
  </div>
</template>

<style scoped>
.dashboard-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Navbar */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  margin: 16px;
  border-radius: 20px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-logo {
  font-size: 24px;
}

.nav-title {
  font-family: var(--font-family-title);
  font-size: 20px;
  font-weight: 800;
  background: linear-gradient(135deg, #f3f4f6 30%, #a5b4fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar-container {
  position: relative;
  width: 42px;
  height: 42px;
}

.user-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.1);
  object-fit: cover;
}

.glow-ring {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 2px solid transparent;
  background: linear-gradient(135deg, #6366f1, #d946ef) border-box;
  mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.user-meta {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.user-email {
  font-size: 11px;
  color: var(--text-secondary);
}

.logout-btn {
  padding: 8px 14px;
  font-size: 12px;
}

/* Dashboard Layout */
.dashboard-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 16px 24px 64px 24px;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

/* Welcome Section */
.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.welcome-text h1 {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 6px;
  background: linear-gradient(135deg, #fff 50%, #c7d2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.welcome-text p {
  color: var(--text-secondary);
  font-size: 16px;
}

.action-btn {
  font-size: 16px;
  padding: 14px 28px;
}

/* Retrospectives list */
.retros-list-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-purple {
  width: 32px;
  height: 32px;
  color: #c084fc;
}

.boards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 64px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 500px;
  margin: 40px auto;
}

.empty-icon {
  font-size: 48px;
}

.empty-state p {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 8px;
}

/* Loading Boards */
.loading-boards {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 64px;
  color: var(--text-secondary);
}

/* Responsiveness */
@media (max-width: 768px) {
  .hide-mobile {
    display: none !important;
  }
  .welcome-section {
    flex-direction: column;
    align-items: stretch;
  }
  .welcome-actions {
    display: flex;
  }
  .action-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
