<script setup>
import { ref, computed } from 'vue';
import { BrainCircuit, Sparkles, HelpCircle, Save, UserPlus, Check, Loader2, Circle, CircleDot, CheckCircle2 } from 'lucide-vue-next';

const MAX_GENERATIONS = 3;

const props = defineProps({
  actionItems: { type: Array, required: true },
  moodSummary: { type: String, required: true },
  moodEmoji: { type: String, required: true },
  isCreator: { type: Boolean, required: true },
  isGenerating: { type: Boolean, required: true },
  error: { type: String, required: true },
  participants: { type: Array, default: () => [] },
  actionsPlanSaved: { type: Boolean, default: false },
  aiGenerationCount: { type: Number, default: 0 },
  // Preview items: generated but not yet saved
  pendingItems: { type: Array, default: () => [] },
  pendingMood: { type: Object, default: null },
  currentUserEmail: { type: String, default: '' },
  currentUserUid: { type: String, default: '' }
});

const emit = defineEmits(['generate', 'save-plan', 'update-status']);

// Local assignment state for preview mode
const assignments = ref({});

const remainingGenerations = computed(() => MAX_GENERATIONS - props.aiGenerationCount);
const canGenerate = computed(() => remainingGenerations.value > 0 && !props.actionsPlanSaved);

// Items to display: saved ones or pending preview ones
const displayItems = computed(() => {
  if (props.actionsPlanSaved) return props.actionItems;
  if (props.pendingItems.length > 0) return props.pendingItems;
  return [];
});

// Mood to display: saved or pending
const displayMood = computed(() => {
  if (props.actionsPlanSaved) {
    return { summary: props.moodSummary, emoji: props.moodEmoji };
  }
  if (props.pendingMood) {
    return { summary: props.pendingMood.summary, emoji: props.pendingMood.emoji };
  }
  return { summary: '', emoji: '' };
});

const isPreviewMode = computed(() => !props.actionsPlanSaved && props.pendingItems.length > 0);

// Check if all pending items have assignments
const allAssigned = computed(() => {
  if (props.pendingItems.length === 0) return false;
  return props.pendingItems.every((_, i) => assignments.value[i]?.email);
});

const handleSavePlan = () => {
  const enrichedItems = props.pendingItems.map((item, i) => ({
    id: `action_${Date.now()}_${i}`,
    text: item.text,
    reason: item.reason,
    assignedTo: assignments.value[i]?.email || '',
    assignedToName: assignments.value[i]?.name || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
    completedAt: null
  }));
  emit('save-plan', enrichedItems);
};

// Status cycling for saved items
const cycleStatus = (item) => {
  // Only creator can change any status; participants can change their own
  const canEdit = props.isCreator || item.assignedTo === props.currentUserEmail;
  if (!canEdit) return;

  const statusOrder = ['pending', 'in_progress', 'done'];
  const currentIndex = statusOrder.indexOf(item.status);
  const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
  emit('update-status', item.id, nextStatus);
};

const canEditStatus = (item) => {
  return props.isCreator || item.assignedTo === props.currentUserEmail;
};

const statusLabel = (status) => {
  const labels = { pending: 'Pendiente', in_progress: 'En Progreso', done: 'Completado' };
  return labels[status] || 'Pendiente';
};

const statusIcon = (status) => {
  const icons = { pending: Circle, in_progress: CircleDot, done: CheckCircle2 };
  return icons[status] || Circle;
};

// Progress stats for saved plan
const completedCount = computed(() => props.actionItems.filter(i => i.status === 'done').length);
const totalCount = computed(() => props.actionItems.length);
const progressPercent = computed(() => totalCount.value ? Math.round((completedCount.value / totalCount.value) * 100) : 0);
</script>

<template>
  <section class="ai-actionables-section glass-panel">
    <!-- Header Area -->
    <div class="ai-section-header">
      <div class="ai-title">
        <component :is="BrainCircuit" class="ai-icon" />
        <h2>{{ actionsPlanSaved ? 'Plan de Acción' : 'Accionables sugeridos por IA (Gemini)' }}</h2>
      </div>
      <div class="ai-header-actions">
        <!-- Generate button (only when plan not saved) -->
        <button 
          v-if="isCreator && !actionsPlanSaved" 
          @click="emit('generate')" 
          :disabled="isGenerating || !canGenerate" 
          class="glass-btn glass-btn-primary ai-gen-btn"
        >
          <component :is="isGenerating ? Loader2 : Sparkles" :class="['icon-sm', { 'spin-icon': isGenerating }]" />
          <span v-if="isGenerating">Pensando...</span>
          <span v-else-if="!canGenerate">Límite alcanzado</span>
          <span v-else>{{ pendingItems.length > 0 ? 'Regenerar' : 'Generar con IA' }}</span>
        </button>
        <span v-if="isCreator && !actionsPlanSaved && canGenerate" class="gen-counter">
          {{ remainingGenerations }}/{{ MAX_GENERATIONS }} restantes
        </span>
      </div>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="ai-error-banner">
      <span>⚠️ {{ error }}</span>
    </div>

    <!-- Progress Bar (saved plan) -->
    <div v-if="actionsPlanSaved && totalCount > 0" class="plan-progress">
      <div class="progress-header">
        <span class="progress-label">Progreso del equipo</span>
        <span class="progress-percent">{{ progressPercent }}%</span>
      </div>
      <div class="progress-bar-track">
        <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <span class="progress-detail">{{ completedCount }} de {{ totalCount }} completados</span>
    </div>

    <!-- Team Mood Analysis Card -->
    <div v-if="displayMood.summary || displayMood.emoji" class="mood-card glass-panel">
      <div class="mood-emoji-container">
        <span class="mood-emoji">{{ displayMood.emoji }}</span>
        <div class="mood-emoji-glow"></div>
      </div>
      <div class="mood-content">
        <h4 class="mood-title">Sentimiento del Sprint</h4>
        <p class="mood-text">{{ displayMood.summary }}</p>
      </div>
    </div>

    <!-- ======= PREVIEW MODE (Not Saved) ======= -->
    <template v-if="isPreviewMode">
      <div class="preview-banner glass-panel">
        <component :is="UserPlus" class="preview-icon" />
        <p>Asigná cada accionable a un participante y guardá el plan para hacer seguimiento.</p>
      </div>

      <div class="actionables-grid">
        <div 
          v-for="(action, index) in pendingItems" 
          :key="index" 
          class="actionable-item glass-panel preview-item"
        >
          <span class="action-index">#{{ index + 1 }}</span>
          <div class="action-content">
            <p class="action-text">{{ action.text }}</p>
            <small class="action-reason">{{ action.reason }}</small>
            <!-- Assignment Dropdown -->
            <div class="assignment-row">
              <label class="assign-label">Asignar a:</label>
              <select 
                class="glass-input assign-select"
                v-model="assignments[index]"
                @change="() => {}"
              >
                <option :value="undefined" disabled>Seleccionar participante...</option>
                <option 
                  v-for="email in participants" 
                  :key="email" 
                  :value="{ email, name: email.split('@')[0] }"
                >
                  {{ email }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Plan Button -->
      <div class="save-plan-footer">
        <button 
          @click="handleSavePlan"
          :disabled="!allAssigned"
          class="glass-btn glass-btn-primary save-plan-btn"
        >
          <component :is="Save" class="icon-sm" />
          <span>Guardar Plan de Acción</span>
        </button>
        <small v-if="!allAssigned" class="save-hint">Asigná todos los accionables para poder guardar</small>
      </div>
    </template>

    <!-- ======= SAVED MODE (Tracking) ======= -->
    <template v-else-if="actionsPlanSaved && actionItems.length > 0">
      <div class="actionables-grid saved-grid">
        <div 
          v-for="action in actionItems" 
          :key="action.id" 
          :class="['actionable-item', 'glass-panel', 'saved-item', `status-${action.status}`]"
        >
          <!-- Status toggle button -->
          <button 
            class="status-toggle-btn"
            :class="{ clickable: canEditStatus(action) }"
            :title="canEditStatus(action) ? `Cambiar estado (actualmente: ${statusLabel(action.status)})` : statusLabel(action.status)"
            @click="cycleStatus(action)"
            :disabled="!canEditStatus(action)"
          >
            <component :is="statusIcon(action.status)" :size="24" />
          </button>

          <div class="action-content">
            <p :class="['action-text', { 'text-done': action.status === 'done' }]">{{ action.text }}</p>
            <small class="action-reason">{{ action.reason }}</small>
            <div class="action-meta">
              <span :class="['status-badge', `badge-${action.status}`]">
                {{ statusLabel(action.status) }}
              </span>
              <span class="assigned-badge" v-if="action.assignedToName">
                👤 {{ action.assignedToName }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ======= EMPTY STATE ======= -->
    <div v-else-if="!isGenerating && !displayMood.summary" class="actionables-empty">
      <component :is="HelpCircle" class="empty-icon-sub" />
      <p>{{ isCreator ? 'Hacé clic en "Generar con IA" para analizar las tarjetas más votadas.' : 'El moderador generará los accionables pronto.' }}</p>
    </div>

    <!-- Generating Loader -->
    <div v-else-if="isGenerating" class="generating-placeholder">
      <span class="spinner-pulse"></span>
      <p>El Agile Coach de IA está analizando los comentarios más votados...</p>
    </div>
  </section>
</template>

<style scoped>
.ai-actionables-section {
  padding: 24px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(236, 72, 153, 0.03) 100%);
  border: 1px solid rgba(99, 102, 241, 0.15);
}

.ai-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.ai-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-icon {
  width: 28px;
  height: 28px;
  color: #c084fc;
}

.ai-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-gen-btn {
  font-size: 13px;
}

.gen-counter {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ai-error-banner {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
}

/* Progress Bar */
.plan-progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.progress-percent {
  font-size: 14px;
  font-weight: 800;
  font-family: var(--font-family-title);
  color: #10b981;
}

.progress-bar-track {
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

[data-theme="light"] .progress-bar-track {
  background: rgba(0, 0, 0, 0.06);
}

.progress-bar-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #6366f1, #10b981);
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.progress-detail {
  font-size: 11px;
  color: var(--text-muted);
}

/* Mood Card */
.mood-card {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-color: rgba(255, 255, 255, 0.12);
  border-radius: 16px;
}

.mood-emoji-container {
  position: relative;
  width: 70px;
  height: 70px;
  min-width: 70px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.1);
}

.mood-emoji {
  font-size: 38px;
  z-index: 2;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.3));
  animation: float-emoji 3s infinite ease-in-out;
}

.mood-emoji-glow {
  position: absolute;
  inset: 10px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(192, 132, 252, 0.4) 0%, rgba(192, 132, 252, 0) 70%);
  filter: blur(8px);
  z-index: 1;
}

@keyframes float-emoji {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.mood-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.mood-title {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: linear-gradient(135deg, #a5b4fc 0%, #c084fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.mood-text {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
}

/* Preview Banner */
.preview-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 13px;
  color: var(--text-secondary);
  background: rgba(245, 158, 11, 0.06);
  border-color: rgba(245, 158, 11, 0.15);
}

.preview-icon {
  width: 20px;
  height: 20px;
  min-width: 20px;
  color: #f59e0b;
}

/* Actionables Grid */
.actionables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.actionable-item {
  padding: 20px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  border-radius: 14px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

/* Preview mode item styling */
.preview-item {
  border: 1px dashed rgba(245, 158, 11, 0.25);
}

.action-index {
  font-family: var(--font-family-title);
  font-size: 20px;
  font-weight: 800;
  color: #c084fc;
}

.action-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.action-text {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  text-align: left;
}

.text-done {
  text-decoration: line-through;
  opacity: 0.6;
}

.action-reason {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.4;
  text-align: left;
}

/* Assignment Dropdown */
.assignment-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.assign-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
}

.assign-select {
  font-size: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}

/* Save Plan Footer */
.save-plan-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.save-plan-btn {
  font-size: 15px;
  padding: 14px 28px;
}

.save-hint {
  font-size: 11px;
  color: var(--text-muted);
}

/* === SAVED MODE === */

/* Status toggle button */
.status-toggle-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: default;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: transform 0.2s ease, color 0.2s ease;
  min-width: 28px;
  margin-top: 2px;
}

.status-toggle-btn.clickable {
  cursor: pointer;
}

.status-toggle-btn.clickable:hover {
  transform: scale(1.15);
}

.status-toggle-btn.clickable:active {
  transform: scale(0.9);
}

/* Saved item status colors */
.saved-item.status-pending .status-toggle-btn {
  color: var(--text-muted);
}

.saved-item.status-in_progress .status-toggle-btn {
  color: #6366f1;
}

.saved-item.status-done .status-toggle-btn {
  color: #10b981;
}

.saved-item.status-done {
  opacity: 0.65;
}

.saved-item.status-done:hover {
  opacity: 1;
}

/* Action Meta (status badge + assigned) */
.action-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
  flex-wrap: wrap;
}

.status-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.badge-pending {
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.25);
  color: #fbbf24;
}

.badge-in_progress {
  background: rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.25);
  color: #a5b4fc;
}

.badge-done {
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.25);
  color: #6ee7b7;
}

[data-theme="light"] .badge-pending { color: #b45309; }
[data-theme="light"] .badge-in_progress { color: #4338ca; }
[data-theme="light"] .badge-done { color: #047857; }

.assigned-badge {
  font-size: 11px;
  color: var(--text-secondary);
}

/* Empty & Loading */
.actionables-empty {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.empty-icon-sub {
  width: 42px;
  height: 42px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.generating-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px;
  color: var(--text-secondary);
}

@media (max-width: 576px) {
  .mood-card {
    flex-direction: column;
    text-align: center;
    align-items: center;
    padding: 20px;
    gap: 16px;
  }
  .mood-content {
    text-align: center;
  }
  .ai-section-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .save-plan-footer {
    flex-direction: column;
    align-items: stretch;
  }
  .save-plan-btn {
    justify-content: center;
  }
}
</style>
