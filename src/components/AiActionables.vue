<script setup>
import { BrainCircuit, Sparkles, HelpCircle } from 'lucide-vue-next';

defineProps({
  actionItems: {
    type: Array,
    required: true
  },
  moodSummary: {
    type: String,
    required: true
  },
  moodEmoji: {
    type: String,
    required: true
  },
  isCreator: {
    type: Boolean,
    required: true
  },
  isGenerating: {
    type: Boolean,
    required: true
  },
  error: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['generate']);
</script>

<template>
  <section class="ai-actionables-section glass-panel">
    <!-- Header Area -->
    <div class="ai-section-header">
      <div class="ai-title">
        <component :is="BrainCircuit" class="ai-icon" />
        <h2>Accionables sugeridos por IA (Gemini)</h2>
      </div>
      <button 
        v-if="isCreator" 
        @click="emit('generate')" 
        :disabled="isGenerating" 
        class="glass-btn glass-btn-primary ai-gen-btn"
      >
        <component :is="Sparkles" class="icon-sm" />
        <span>{{ isGenerating ? 'Pensando...' : 'Generar / Actualizar con IA' }}</span>
      </button>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="ai-error-banner">
      <span>⚠️ {{ error }}</span>
    </div>

    <!-- Team Mood Analysis Card (Renders if available) -->
    <div v-if="moodSummary || moodEmoji" class="mood-card glass-panel">
      <div class="mood-emoji-container">
        <span class="mood-emoji">{{ moodEmoji }}</span>
        <div class="mood-emoji-glow"></div>
      </div>
      <div class="mood-content">
        <h4 class="mood-title">Sentimiento del Sprint</h4>
        <p class="mood-text">{{ moodSummary }}</p>
      </div>
    </div>

    <!-- Actions Cards Stack -->
    <div v-if="actionItems && actionItems.length > 0" class="actionables-grid">
      <div 
        v-for="(action, index) in actionItems" 
        :key="index" 
        class="actionable-item glass-panel"
      >
        <span class="action-index">#{{ index + 1 }}</span>
        <div class="action-content">
          <p class="action-text">{{ action.text }}</p>
          <small class="action-reason">{{ action.reason }}</small>
        </div>
      </div>
    </div>
    
    <!-- Empty Actions Banner -->
    <div v-else-if="!isGenerating && !moodSummary" class="actionables-empty">
      <component :is="HelpCircle" class="empty-icon-sub" />
      <p>Aún no se han generado accionables. {{ isCreator ? 'Haz clic en "Generar con IA" para analizar las tarjetas más votadas.' : 'El moderador generará los accionables pronto.' }}</p>
    </div>

    <!-- Generating Loader state inside body -->
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

.ai-gen-btn {
  font-size: 13px;
}

.ai-error-banner {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
}

/* Upgraded Team Mood Glassmorphic Panel Styles */
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

/* Actions cards grid */
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
}

.action-text {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  text-align: left;
}

.action-reason {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.4;
  text-align: left;
}

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
}
</style>
