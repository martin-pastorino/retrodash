<script setup>
import { ref, watch } from 'vue';
import { Sparkles, Plus } from 'lucide-vue-next';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['close', 'create']);

// Form states
const newBoardName = ref('');
const newBoardDuration = ref(15);
const newBoardParticipants = ref('');
const newBoardScheduledAt = ref('');
const customColumns = ref([
  { id: 'good', name: '😊 Lo que salió bien', color: '#10b981' },
  { id: 'bad', name: '😢 Lo que salió mal', color: '#ef4444' },
  { id: 'improve', name: '💡 Cosas a mejorar', color: '#f59e0b' }
]);

const createError = ref('');

// New Column addition states
const newColName = ref('');
const newColColor = ref('#3b82f6');

// Reset states when show triggers
watch(() => props.show, (isOpen) => {
  if (isOpen) {
    newBoardName.value = '';
    newBoardDuration.value = 15;
    newBoardParticipants.value = '';
    newBoardScheduledAt.value = '';
    createError.value = '';
    customColumns.value = [
      { id: 'good', name: '😊 Lo que salió bien', color: '#10b981' },
      { id: 'bad', name: '😢 Lo que salió mal', color: '#ef4444' },
      { id: 'improve', name: '💡 Cosas a mejorar', color: '#f59e0b' }
    ];
  }
});

const addCustomColumn = () => {
  if (!newColName.value.trim()) return;
  const id = 'col_' + Date.now();
  customColumns.value.push({
    id,
    name: newColName.value.trim(),
    color: newColColor.value
  });
  newColName.value = '';
};

const removeCustomColumn = (index) => {
  customColumns.value.splice(index, 1);
};

const handleCreate = () => {
  if (!newBoardName.value.trim()) return;
  
  createError.value = '';
  const columnsData = customColumns.value.map(col => ({
    id: col.id,
    name: col.name,
    color: `rgba(${hexToRgb(col.color)}, 0.15)`,
    borderColor: `rgba(${hexToRgb(col.color)}, 0.35)`
  }));

  emit('create', {
    name: newBoardName.value.trim(),
    duration: newBoardDuration.value,
    participants: newBoardParticipants.value,
    columns: columnsData,
    scheduledAt: newBoardScheduledAt.value || null
  }, (errorMsg) => {
    if (errorMsg) {
      createError.value = errorMsg;
    }
  });
};

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 255, 255';
}
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-content glass-panel">
      <div class="modal-header">
        <h2>Crear Nueva Retrospectiva</h2>
        <button @click="emit('close')" class="close-btn">&times;</button>
      </div>

      <div class="modal-body">
        <!-- Error banner inside modal -->
        <div v-if="createError" class="error-banner">
          <span>⚠️ {{ createError }}</span>
        </div>

        <!-- Board Name -->
        <div class="form-group">
          <label>Nombre de la Retro</label>
          <input 
            v-model="newBoardName" 
            type="text" 
            placeholder="Ej. Retro Sprint 45 - Fénix" 
            class="glass-input"
          />
        </div>

        <!-- Board Duration -->
        <div class="form-group">
          <label>Tiempo de la Lluvia de Ideas (Minutos)</label>
          <div class="duration-control">
            <input 
              v-model="newBoardDuration" 
              type="number" 
              min="1" 
              max="120" 
              class="glass-input duration-input"
            />
            <span class="duration-suffix">minutos</span>
          </div>
        </div>

        <!-- Programmed Retro Date & Time -->
        <div class="form-group">
          <label>Programar Fecha y Hora de Inicio (Opcional)</label>
          <input 
            v-model="newBoardScheduledAt" 
            type="datetime-local" 
            class="glass-input"
          />
          <small class="form-help">Si programas la retro, el equipo recibirá una notificación push 10 minutos antes de comenzar.</small>
        </div>

        <!-- Invite Participants -->
        <div class="form-group">
          <label>Participantes Invitados (Emails separados por coma)</label>
          <textarea 
            v-model="newBoardParticipants" 
            placeholder="ejemplo1@gmail.com, ejemplo2@gmail.com..." 
            class="glass-input textarea-input"
            rows="3"
          ></textarea>
          <small class="form-help">Solo los usuarios con estas cuentas de Google podrán unirse. Deja vacío para acceso abierto con link.</small>
        </div>

        <!-- Custom Columns Creator -->
        <div class="form-group">
          <label>Columnas del Tablero</label>
          
          <div class="columns-list">
            <div v-for="(col, index) in customColumns" :key="col.id" class="column-item-badge">
              <span class="column-color-indicator" :style="{ backgroundColor: col.color }"></span>
              <span class="column-badge-name">{{ col.name }}</span>
              <button @click="removeCustomColumn(index)" class="column-badge-delete" title="Eliminar Columna">&times;</button>
            </div>
          </div>

          <!-- New Column Inputs -->
          <div class="add-column-form">
            <input 
              v-model="newColName" 
              type="text" 
              placeholder="Añadir columna custom..." 
              class="glass-input col-name-input"
              @keyup.enter="addCustomColumn"
            />
            <div class="color-picker-wrapper">
              <input type="color" v-model="newColColor" class="color-picker-input" />
            </div>
            <button @click="addCustomColumn" class="glass-btn add-col-btn" type="button">
              <component :is="Plus" class="icon-sm" />
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="emit('close')" class="glass-btn glass-btn-secondary">Cancelar</button>
        <button 
          @click="handleCreate" 
          :disabled="!newBoardName.trim() || customColumns.length === 0" 
          class="glass-btn glass-btn-primary"
        >
          <component :is="Sparkles" class="icon-sm" />
          <span>Crear Tablero</span>
        </button>
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

.error-banner {
  background: var(--bg-error);
  border: 1px solid var(--border-error);
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  color: var(--text-error);
  text-align: left;
  margin-bottom: 8px;
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

.duration-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.duration-input {
  width: 100px;
  text-align: center;
}

.duration-suffix {
  font-size: 14px;
  color: var(--text-secondary);
}

.textarea-input {
  resize: vertical;
}

.columns-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.column-item-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: 6px 12px;
}

.column-color-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.column-badge-name {
  font-size: 12px;
  font-weight: 500;
}

.column-badge-delete {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.column-badge-delete:hover {
  color: #ef4444;
}

.add-column-form {
  display: flex;
  gap: 10px;
  align-items: center;
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
