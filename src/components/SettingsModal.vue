<script setup>
import { ref, watch } from 'vue';
import { Copy, Plus, Trash2 } from 'lucide-vue-next';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  isCreator: {
    type: Boolean,
    required: true
  },
  boardId: {
    type: String,
    required: true
  },
  columns: {
    type: Array,
    required: true
  },
  isCopied: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits([
  'close', 
  'save-api-key', 
  'add-column', 
  'remove-column', 
  'copy-link'
]);

const geminiApiKeyInput = ref(localStorage.getItem('RETRODASH_GEMINI_KEY') || '');
const newColName = ref('');
const newColColor = ref('#8b5cf6');

// Sync key input on display
watch(() => props.show, (isOpen) => {
  if (isOpen) {
    geminiApiKeyInput.value = localStorage.getItem('RETRODASH_GEMINI_KEY') || '';
  }
});

const handleSaveAndClose = () => {
  localStorage.setItem('RETRODASH_GEMINI_KEY', geminiApiKeyInput.value.trim());
  emit('save-api-key', geminiApiKeyInput.value.trim());
  emit('close');
};

const handleAddCol = () => {
  if (!newColName.value.trim()) return;
  const rgb = hexToRgb(newColColor.value);
  emit('add-column', {
    name: newColName.value.trim(),
    color: `rgba(${rgb}, 0.15)`,
    borderColor: `rgba(${rgb}, 0.35)`
  });
  newColName.value = '';
};

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 255, 255';
}
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click.self="handleSaveAndClose">
    <div class="modal-content glass-panel">
      <div class="modal-header">
        <h2>Configuración del Tablero</h2>
        <button @click="handleSaveAndClose" class="close-btn">&times;</button>
      </div>

      <div class="modal-body">
        <!-- API KEY CONFIGURATION -->
        <div class="form-group">
          <label>Gemini API Key (Para Inteligencia Artificial)</label>
          <input 
            v-model="geminiApiKeyInput" 
            type="password" 
            placeholder="Ingresa tu Gemini API Key..." 
            class="glass-input"
          />
          <small class="form-help">
            Consigue una API Key gratis en 
            <a href="https://aistudio.google.com/" target="_blank" class="form-link">Google AI Studio</a>.
            Se guarda localmente y se usa para resumir accionables.
          </small>
        </div>

        <!-- Board Code Share Display -->
        <div class="form-group">
          <label>ID / Código de Acceso del Tablero</label>
          <div class="code-share-wrapper">
            <span class="board-id-display">{{ boardId }}</span>
            <button @click="emit('copy-link')" class="glass-btn copy-btn">
              <component :is="Copy" class="icon-sm" />
              <span>{{ isCopied ? 'Copiado' : 'Copiar' }}</span>
            </button>
          </div>
        </div>

        <!-- Column Editor (Creator only) -->
        <div v-if="isCreator" class="form-group">
          <label>Administrar Columnas</label>
          <div class="settings-columns-list">
            <div v-for="col in columns" :key="col.id" class="settings-column-item glass-panel">
              <div class="col-info">
                <span class="col-dot" :style="{ backgroundColor: col.borderColor || col.color || '#fff' }"></span>
                <span class="col-name">{{ col.name }}</span>
              </div>
              <button 
                @click="emit('remove-column', col.id)" 
                class="glass-btn glass-btn-danger remove-col-btn-small"
                :disabled="columns.length <= 1"
                title="Eliminar columna"
              >
                <component :is="Trash2" class="icon-xs" />
              </button>
            </div>
          </div>

          <!-- Add Column Settings Form -->
          <div class="settings-add-col">
            <input 
              v-model="newColName" 
              type="text" 
              placeholder="Añadir columna custom..." 
              class="glass-input col-name-input"
              @keyup.enter="handleAddCol"
            />
            <div class="color-picker-wrapper">
              <input type="color" v-model="newColColor" class="color-picker-input" />
            </div>
            <button @click="handleAddCol" class="glass-btn add-col-btn">
              <component :is="Plus" class="icon-sm" />
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="handleSaveAndClose" class="glass-btn glass-btn-primary">Guardar y Cerrar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--modal-backdrop);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: var(--modal-bg) !important;
  border-color: var(--modal-border) !important;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding-bottom: 16px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: var(--text-secondary);
  cursor: pointer;
}

.close-btn:hover {
  color: var(--text-primary);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.form-help {
  font-size: 11px;
  color: var(--text-muted);
}

.form-link {
  color: #818cf8;
  text-decoration: underline;
}

.code-share-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.board-id-display {
  font-family: monospace;
  font-size: 14px;
  padding: 10px 16px;
  border-radius: 8px;
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.06);
  flex-grow: 1;
  word-break: break-all;
}

.settings-columns-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.settings-column-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-radius: 10px;
}

.col-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.col-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.col-name {
  font-size: 13px;
  font-weight: 500;
}

.remove-col-btn-small {
  padding: 6px 10px;
}

.settings-add-col {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.col-name-input {
  flex: 1;
}

.color-picker-wrapper {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.1);
  overflow: hidden;
  cursor: pointer;
}

.color-picker-input {
  position: absolute;
  inset: -5px;
  width: 52px;
  height: 52px;
  border: none;
  padding: 0;
  background: none;
  cursor: pointer;
}

.add-col-btn {
  padding: 12px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid rgba(255,255,255,0.06);
  padding-top: 16px;
}
</style>
