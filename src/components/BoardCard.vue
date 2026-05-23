<script setup>
import { Clock, Users, ArrowRight } from 'lucide-vue-next';

defineProps({
  board: {
    type: Object,
    required: true
  }
});

const formatDate = (timestamp) => {
  if (!timestamp) return 'Reciente';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
};
</script>

<template>
  <div 
    :class="['board-card', 'glass-panel', 'glass-panel-hover', `card-status-${board.status}`]"
    role="button"
    tabindex="0"
    aria-haspopup="dialog"
    :aria-label="`Tablero de retrospectiva: ${board.name}. Creado por ${board.createdByName || 'Admin'} el ${formatDate(board.createdAt)}. Estado: ${board.status === 'brainstorm' ? 'Lluvia de Ideas' : board.status === 'voting' ? 'Votación' : 'Accionables IA'}. Duración: ${board.durationMinutes} minutos. ${board.participants?.length || 0} participantes.`"
    @keydown.enter="$emit('click')"
    @keydown.space.prevent="$emit('click')"
  >
    <!-- Card Top Header -->
    <div class="board-card-header">
      <span class="board-date">{{ formatDate(board.createdAt) }}</span>
      <span :class="['badge-status', `status-${board.status}`]">
        {{ board.status === 'brainstorm' ? 'Lluvia de Ideas' : board.status === 'voting' ? 'Votación' : 'Accionables IA' }}
      </span>
    </div>
    
    <!-- Central Content Area (Elastic & Anchored) -->
    <div class="board-card-body">
      <h3 class="board-title" :title="board.name" aria-hidden="true">
        {{ board.name }}
      </h3>

      <div class="board-card-details">
        <div class="detail-item" :title="`Duración: ${board.durationMinutes} minutos`">
          <component :is="Clock" class="detail-icon" />
          <span>{{ board.durationMinutes }} mins</span>
        </div>
        <div class="detail-item" :title="`Participantes: ${board.participants?.length || 0}`">
          <component :is="Users" class="detail-icon" />
          <span>{{ board.participants?.length || 0 }} part.</span>
        </div>
      </div>

      <!-- Columns Lanes Preview Colors -->
      <div class="board-columns-preview">
        <div 
          v-for="col in board.columns" 
          :key="col.id" 
          class="col-preview-dot"
          :style="{ backgroundColor: col.borderColor || col.color || '#fff' }"
          :title="`Columna: ${col.name}`"
        ></div>
      </div>
    </div>

    <!-- Bottom Footer (Anchored strictly to the bottom) -->
    <div class="board-card-footer">
      <span class="board-author">Por: {{ board.createdByName?.split(' ')[0] || 'Admin' }}</span>
      <span class="board-enter-link">
        <span>Entrar</span>
        <component :is="ArrowRight" class="icon-sm anim-arrow" />
      </span>
    </div>
  </div>
</template>

<style scoped>
.board-card {
  padding: 24px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 250px;
  height: 100%;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), 
              background-color 0.4s ease, 
              border-color 0.4s ease, 
              box-shadow 0.4s ease,
              backdrop-filter 0.4s ease;
  outline: none;
}

/* Accessibility: keyboard focus indicator */
.board-card:focus-visible {
  outline: 2px solid #a5b4fc;
  outline-offset: 4px;
  transform: translateY(-6px);
}

.board-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.board-date {
  font-size: 12px;
  color: var(--text-secondary);
}

.badge-status {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.status-brainstorm {
  background: var(--badge-brainstorm-bg);
  border: 1px solid var(--badge-brainstorm-border);
  color: var(--badge-brainstorm-color);
}

.status-voting {
  background: var(--badge-voting-bg);
  border: 1px solid var(--badge-voting-border);
  color: var(--badge-voting-color);
}

.status-completed {
  background: var(--badge-completed-bg);
  border: 1px solid var(--badge-completed-border);
  color: var(--badge-completed-color);
}

/* Body container: keeps card elements visually structured together */
.board-card-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex-grow: 1;
}

.board-title {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.35;
  color: var(--text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;  
  overflow: hidden;
  word-break: normal;
  overflow-wrap: anywhere; /* Robust wrap that breaks extremely long strings beautifully */
  transition: color 0.3s ease;
}

.board-card:hover .board-title {
  color: var(--card-title-hover);
}

.board-card-details {
  display: flex;
  gap: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 12px;
}

.detail-icon {
  width: 14px;
  height: 14px;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.board-card:hover .detail-icon {
  transform: scale(1.15);
}

.board-columns-preview {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: auto; /* Vertically push column preview dots to the bottom of body */
  padding-top: 4px;
}

.col-preview-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), 
              box-shadow 0.35s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.board-card:hover .col-preview-dot {
  transform: scale(1.3);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.45);
}

.board-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 14px;
  margin-top: 12px;
}

.board-author {
  font-size: 11px;
  color: var(--text-muted);
}

.board-enter-link {
  font-size: 13px;
  font-weight: 600;
  color: #a5b4fc;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.3s ease, text-shadow 0.3s ease;
}

.board-card:hover .board-enter-link {
  color: var(--card-enter-hover);
  text-shadow: 0 0 8px var(--card-enter-glow);
}

.board-card:hover .anim-arrow {
  transform: translateX(6px) scale(1.1);
}

.anim-arrow {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* --- Interactive Hover Ambient Glows based on Board Status (WOW Effect) --- */
.board-card.card-status-brainstorm:hover {
  transform: translateY(-6px);
  border-color: rgba(99, 102, 241, 0.35);
  box-shadow: 0 20px 40px -10px rgba(99, 102, 241, 0.28), 
              0 0 22px 0 rgba(99, 102, 241, 0.15), 
              var(--glass-shadow-inset);
}

.board-card.card-status-voting:hover {
  transform: translateY(-6px);
  border-color: rgba(245, 158, 11, 0.35);
  box-shadow: 0 20px 40px -10px rgba(245, 158, 11, 0.28), 
              0 0 22px 0 rgba(245, 158, 11, 0.15), 
              var(--glass-shadow-inset);
}

.board-card.card-status-completed:hover {
  transform: translateY(-6px);
  border-color: rgba(16, 185, 129, 0.35);
  box-shadow: 0 20px 40px -10px rgba(16, 185, 129, 0.28), 
              0 0 22px 0 rgba(16, 185, 129, 0.15), 
              var(--glass-shadow-inset);
}
</style>
