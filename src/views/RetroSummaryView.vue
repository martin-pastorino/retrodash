<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useBoardStore } from '../stores/board';
import { 
  ArrowLeft, 
  BrainCircuit, 
  Sparkles, 
  Copy, 
  Check, 
  Circle, 
  CircleDot, 
  CheckCircle2, 
  Calendar, 
  User,
  ExternalLink,
  ChevronLeft,
  Download
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const boardStore = useBoardStore();

const boardId = route.params.id;
const isCopied = ref(false);

onMounted(() => {
  boardStore.subscribeToBoard(boardId);
  boardStore.subscribeToCards(boardId);
});

onUnmounted(() => {
  boardStore.unsubscribeAll();
});

const board = computed(() => boardStore.activeBoard);
const currentUser = computed(() => authStore.user);

const isCreator = computed(() => {
  return board.value?.createdBy === currentUser.value?.uid;
});

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

// Progress calculations
const totalActions = computed(() => board.value?.actionItems?.length || 0);
const completedActions = computed(() => {
  return board.value?.actionItems?.filter(item => item.status === 'done').length || 0;
});
const progressPercent = computed(() => {
  if (totalActions.value === 0) return 0;
  return Math.round((completedActions.value / totalActions.value) * 100);
});

// Interactive state modification (Status cycling)
const cycleStatus = async (item) => {
  const isAssigned = item.assignedTo?.toLowerCase() === currentUser.value?.email?.toLowerCase();
  const canEdit = isCreator.value || isAssigned;
  if (!canEdit) return;

  const statusOrder = ['pending', 'in_progress', 'done'];
  const currentIndex = statusOrder.indexOf(item.status);
  const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

  try {
    await boardStore.updateActionItemStatus(boardId, item.id, nextStatus);
  } catch (error) {
    console.error('Error updating status on summary page:', error);
  }
};

const canEditStatus = (item) => {
  return isCreator.value || item.assignedTo?.toLowerCase() === currentUser.value?.email?.toLowerCase();
};

const statusLabel = (status) => {
  const labels = { pending: 'Pendiente', in_progress: 'En Progreso', done: 'Completado' };
  return labels[status] || 'Pendiente';
};

const statusIcon = (status) => {
  const icons = { pending: Circle, in_progress: CircleDot, done: CheckCircle2 };
  return icons[status] || Circle;
};

// Agile Markdown Export Formatter
const generateMarkdownContent = () => {
  if (!board.value) return '';

  const title = `# 🚀 Reporte de Retrospectiva: ${board.value.name}\n`;
  const meta = `*Fecha:* ${formatDate(board.value.createdAt)} | *Moderador:* ${board.value.createdByName || 'Admin'}\n\n`;
  const mood = `## 📊 Sentimiento del Sprint: ${board.value.moodEmoji || '✨'}\n> ${board.value.moodSummary || 'No se generó resumen del sentimiento.'}\n\n`;
  
  let actionItemsMd = `## 🎯 Plan de Acción (Accionables sugeridos por IA):\n`;
  if (board.value.actionItems && board.value.actionItems.length > 0) {
    board.value.actionItems.forEach((item, index) => {
      const statusSymbol = item.status === 'done' ? '✅' : item.status === 'in_progress' ? '⏳' : '⭕';
      const assigned = item.assignedToName ? `@${item.assignedToName}` : 'Sin asignar';
      actionItemsMd += `${index + 1}. **[${statusSymbol} ${statusLabel(item.status)}]** ${item.text}\n   * *Asignado a:* ${assigned}\n   * *Motivo:* ${item.reason}\n\n`;
    });
  } else {
    actionItemsMd += `*No hay accionables guardados para esta retrospectiva.*\n`;
  }

  const footer = `*Reporte generado automáticamente por RetroDash ✨*`;

  return `${title}${meta}${mood}${actionItemsMd}${footer}`;
};

const copyMarkdownReport = () => {
  const content = generateMarkdownContent();
  if (!content) return;

  navigator.clipboard.writeText(content);
  isCopied.value = true;
  setTimeout(() => isCopied.value = false, 2000);
};

const downloadMarkdownReport = () => {
  const content = generateMarkdownContent();
  if (!content) return;

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'resumen.md');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
</script>

<template>
  <div class="summary-view-container" v-if="board">
    <!-- Navbar / Header -->
    <header class="summary-navbar glass-panel">
      <div class="nav-left">
        <button @click="router.push(`/retro/${boardId}`)" class="glass-btn glass-btn-secondary back-btn-nav" title="Volver al Tablero">
          <component :is="ChevronLeft" class="icon-md" />
          <span>Tablero</span>
        </button>
        <div class="nav-meta">
          <span class="board-badge">Reporte de Retrospectiva</span>
          <h1 class="nav-board-title">{{ board.name }}</h1>
        </div>
      </div>
      
      <div class="nav-actions" style="display: flex; gap: 12px; align-items: center;">
        <button @click="copyMarkdownReport" class="glass-btn glass-btn-secondary copy-report-btn">
          <component :is="isCopied ? Check : Copy" class="icon-sm" />
          <span>{{ isCopied ? '¡Copiado!' : 'Copiar Portapapeles' }}</span>
        </button>
        
        <button @click="downloadMarkdownReport" class="glass-btn glass-btn-primary download-report-btn" style="display: flex; align-items: center; gap: 8px;">
          <component :is="Download" class="icon-sm" />
          <span>Exportar a resumen.md</span>
        </button>
      </div>
    </header>

    <!-- Main Workspace -->
    <main class="summary-workspace">
      
      <!-- Top Grid: Metadata & Stats -->
      <section class="summary-top-grid">
        <!-- Metadata details -->
        <div class="metadata-card glass-panel">
          <h3 class="card-section-title">Detalles de la Retrospectiva</h3>
          
          <div class="meta-items-list">
            <div class="meta-row-item">
              <component :is="Calendar" class="meta-icon" />
              <div class="meta-details">
                <span class="meta-label">Fecha de Sesión</span>
                <span class="meta-value">{{ formatDate(board.createdAt) }}</span>
              </div>
            </div>
            
            <div class="meta-row-item">
              <component :is="User" class="meta-icon" />
              <div class="meta-details">
                <span class="meta-label">Moderador / Agile Coach</span>
                <span class="meta-value">{{ board.createdByName || 'Admin' }} ({{ board.createdByEmail }})</span>
              </div>
            </div>

            <div class="meta-row-item">
              <component :is="BrainCircuit" class="meta-icon" />
              <div class="meta-details">
                <span class="meta-label">Accionables de IA</span>
                <span class="meta-value">Modelado con Gemini 2.5 Flash</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Items Progression -->
        <div class="stats-card glass-panel">
          <h3 class="card-section-title">Progreso del Plan de Acción</h3>
          
          <div class="radial-stats-container">
            <div class="radial-value-container">
              <span class="radial-big-number">{{ completedActions }}/{{ totalActions }}</span>
              <span class="radial-label">Accionables completados</span>
            </div>
            
            <div class="progress-bar-container">
              <div class="progress-bar-header">
                <span>Porcentaje de cumplimiento</span>
                <span class="pct-val">{{ progressPercent }}%</span>
              </div>
              <div class="progress-bar-track">
                <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Sentiment / Mood Analysis Section -->
      <section class="mood-container-summary glass-panel" v-if="board.moodSummary">
        <div class="mood-glow-bubble"></div>
        <div class="mood-badge-icon">
          <span class="mood-emoji-glowing">{{ board.moodEmoji || '✨' }}</span>
          <div class="emoji-light-ring"></div>
        </div>
        <div class="mood-text-details">
          <h2 class="mood-section-header">Sentimiento del Sprint</h2>
          <p class="mood-summary-desc">{{ board.moodSummary }}</p>
        </div>
      </section>

      <!-- Action Items Grid -->
      <section class="action-items-section-summary">
        <div class="action-section-header">
          <component :is="Sparkles" class="star-icon" />
          <h2>Plan de Acción Comprometido</h2>
        </div>

        <div v-if="board.actionItems && board.actionItems.length > 0" class="action-items-vertical-list">
          <div 
            v-for="item in board.actionItems" 
            :key="item.id"
            :class="['actionable-detail-card', 'glass-panel', `status-${item.status}`]"
          >
            <!-- Toggle status checkbox -->
            <button 
              class="cycle-status-button"
              :class="{ clickable: canEditStatus(item) }"
              :disabled="!canEditStatus(item)"
              :title="canEditStatus(item) ? `Ciclar estado (actualmente: ${statusLabel(item.status)})` : `Solo asignado o creador puede cambiar` "
              @click="cycleStatus(item)"
            >
              <component :is="statusIcon(item.status)" :size="28" />
            </button>

            <!-- Card Content -->
            <div class="actionable-body-summary">
              <div class="item-title-row">
                <h4 :class="['item-text-title', { 'line-through-done': item.status === 'done' }]">
                  {{ item.text }}
                </h4>
                
                <span :class="['status-pill', `pill-${item.status}`]">
                  {{ statusLabel(item.status) }}
                </span>
              </div>

              <p class="item-reason-summary">
                <strong>Justificación:</strong> {{ item.reason }}
              </p>

              <div class="item-footer-summary">
                <span class="assigned-avatar" v-if="item.assignedToName">
                  👤 Asignado a: <strong>{{ item.assignedToName }}</strong>
                </span>
                <span class="assigned-avatar unassigned" v-else>
                  👤 Sin asignar
                </span>

                <span class="created-at-label" v-if="item.completedAt && item.status === 'done'">
                  🎉 Completado el: {{ new Date(item.completedAt).toLocaleDateString('es-ES') }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty Plan state -->
        <div v-else class="empty-actionables-summary glass-panel">
          <div class="empty-icon-art">🎯</div>
          <h3>El Plan de Acción está vacío</h3>
          <p>Los accionables sugeridos por la IA aún no han sido guardados por el moderador de esta retrospectiva.</p>
          <button @click="router.push(`/retro/${boardId}`)" class="glass-btn glass-btn-secondary">
            <span>Ir al tablero para generar</span>
          </button>
        </div>
      </section>

      <!-- Bottom return link -->
      <footer class="summary-footer-actions">
        <button @click="router.push('/')" class="glass-btn glass-btn-secondary back-to-dashboard-btn">
          <component :is="ArrowLeft" class="icon-sm" />
          <span>Volver al Dashboard</span>
        </button>
      </footer>

    </main>
  </div>

  <!-- Loading State -->
  <div v-else class="summary-loading-screen">
    <span class="spinner-pulse"></span>
    <p>Sincronizando reporte de retrospectiva...</p>
  </div>
</template>

<style scoped>
.summary-view-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 32px;
}

/* Navbar */
.summary-navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-radius: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-btn-nav {
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-meta {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.board-badge {
  font-size: 11px;
  font-weight: 700;
  color: #c084fc;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.nav-board-title {
  font-family: var(--font-family-title);
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
  background: linear-gradient(135deg, #fff 50%, #c7d2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.copy-report-btn,
.download-report-btn {
  padding: 12px 20px;
  font-size: 14px;
}

/* Workspace */
.summary-workspace {
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-bottom: 64px;
}

/* Top grid metadata & stats */
.summary-top-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.metadata-card, .stats-card {
  padding: 24px;
  border-radius: 16px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 12px;
}

.meta-items-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.meta-row-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.meta-icon {
  width: 24px;
  height: 24px;
  color: #a5b4fc;
  background: rgba(99, 102, 241, 0.12);
  padding: 6px;
  border-radius: 8px;
}

.meta-details {
  display: flex;
  flex-direction: column;
}

.meta-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.meta-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

/* Radial stats & progress */
.radial-stats-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
  flex: 1;
}

.radial-value-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
}

.radial-big-number {
  font-family: var(--font-family-title);
  font-size: 32px;
  font-weight: 800;
  color: #10b981;
}

.radial-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 600;
}

.progress-bar-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-bar-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.pct-val {
  color: #10b981;
}

.progress-bar-track {
  height: 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  overflow: hidden;
}

[data-theme="light"] .progress-bar-track {
  background: rgba(0, 0, 0, 0.06);
}

.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #6366f1, #10b981);
  transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Sentiment / Mood Card */
.mood-container-summary {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 32px;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(236, 72, 153, 0.02) 100%);
  border-color: rgba(99, 102, 241, 0.15);
  text-align: left;
}

.mood-glow-bubble {
  position: absolute;
  top: -50%;
  right: -10%;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(192, 132, 252, 0.12) 0%, transparent 70%);
  filter: blur(10px);
  pointer-events: none;
}

.mood-badge-icon {
  position: relative;
  width: 90px;
  height: 90px;
  min-width: 90px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.08);
}

.mood-emoji-glowing {
  font-size: 48px;
  z-index: 2;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4));
  animation: float-emoji-big 4s infinite ease-in-out;
}

.emoji-light-ring {
  position: absolute;
  inset: 12px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(165, 180, 252, 0.35) 0%, transparent 75%);
  filter: blur(10px);
  z-index: 1;
}

@keyframes float-emoji-big {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-6px) scale(1.03); }
}

.mood-text-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mood-section-header {
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: linear-gradient(135deg, #a5b4fc 0%, #c084fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.mood-summary-desc {
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-secondary);
}

/* Action Items List */
.action-items-section-summary {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.action-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
}

.star-icon {
  width: 24px;
  height: 24px;
  color: #fbbf24;
}

.action-section-header h2 {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

.action-items-vertical-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.actionable-detail-card {
  display: flex;
  padding: 24px;
  border-radius: 16px;
  gap: 20px;
  align-items: flex-start;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.01) 0%, rgba(255, 255, 255, 0.03) 100%);
}

.cycle-status-button {
  background: none;
  border: none;
  padding: 4px;
  cursor: default;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  border-radius: 50%;
  transition: transform 0.2s ease, color 0.2s ease;
  min-width: 32px;
  margin-top: 2px;
}

.cycle-status-button.clickable {
  cursor: pointer;
}

.cycle-status-button.clickable:hover {
  transform: scale(1.15);
}

.cycle-status-button.clickable:active {
  transform: scale(0.9);
}

/* Saved states styling */
.actionable-detail-card.status-pending .cycle-status-button {
  color: var(--text-muted);
}

.actionable-detail-card.status-in_progress {
  border-color: rgba(99, 102, 241, 0.25);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
}

.actionable-detail-card.status-in_progress .cycle-status-button {
  color: #6366f1;
}

.actionable-detail-card.status-done {
  border-color: rgba(16, 185, 129, 0.2);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%);
  opacity: 0.65;
}

.actionable-detail-card.status-done:hover {
  opacity: 1;
}

.actionable-detail-card.status-done .cycle-status-button {
  color: #10b981;
}

/* Card layout contents */
.actionable-body-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  text-align: left;
}

.item-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.item-text-title {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--text-primary);
}

.line-through-done {
  text-decoration: line-through;
  opacity: 0.6;
}

.status-pill {
  font-size: 10px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.pill-pending {
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.25);
  color: #fbbf24;
}

.pill-in_progress {
  background: rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.25);
  color: #a5b4fc;
}

.pill-done {
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.25);
  color: #6ee7b7;
}

[data-theme="light"] .pill-pending { color: #b45309; }
[data-theme="light"] .pill-in_progress { color: #4338ca; }
[data-theme="light"] .pill-done { color: #047857; }

.item-reason-summary {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-secondary);
}

.item-footer-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  padding-top: 8px;
  font-size: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.assigned-avatar {
  color: var(--text-secondary);
}

.assigned-avatar.unassigned {
  color: var(--text-muted);
}

.created-at-label {
  color: #10b981;
  font-weight: 600;
}

/* Empty Art State */
.empty-actionables-summary {
  padding: 64px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.empty-icon-art {
  font-size: 48px;
}

.empty-actionables-summary p {
  color: var(--text-secondary);
  font-size: 14px;
  max-width: 400px;
  margin-bottom: 8px;
}

/* Footer return buttons */
.summary-footer-actions {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.back-to-dashboard-btn {
  padding: 12px 28px;
  font-size: 14px;
}

/* Loading screen */
.summary-loading-screen {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  color: var(--text-secondary);
}

/* Responsive overrides */
@media (max-width: 768px) {
  .summary-navbar {
    flex-direction: column;
    align-items: stretch;
  }
  .nav-left {
    flex-direction: column;
    align-items: flex-start;
  }
  .copy-report-btn {
    width: 100%;
    justify-content: center;
  }
  .mood-container-summary {
    flex-direction: column;
    text-align: center;
    padding: 24px;
    gap: 20px;
  }
  .mood-text-details {
    text-align: center;
  }
  .item-title-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
