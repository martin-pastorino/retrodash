<script setup>
import { Lock, User, ThumbsUp } from 'lucide-vue-next';

defineProps({
  card: {
    type: Object,
    required: true
  },
  boardStatus: {
    type: String,
    required: true
  },
  currentUser: {
    type: Object,
    required: true
  },
  isCreator: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['delete', 'vote']);
</script>

<template>
  <div 
    :class="['card-item', 'glass-panel', { 
      'my-card': card.createdByUid === currentUser.uid, 
      'voting-active': boardStatus === 'voting' 
    }]"
  >
    <!-- Peer Bias Shield Masked State -->
    <template v-if="boardStatus === 'brainstorm' && card.createdByUid !== currentUser.uid">
      <div class="card-masked">
        <component :is="Lock" class="mask-icon" />
        <span class="mask-text">Comentario Oculto</span>
        <small class="mask-subtext">Se revelará en la fase de votación</small>
      </div>
    </template>

    <!-- Card Fully Revealed -->
    <template v-else>
      <div class="card-user-info">
        <div class="card-author-details">
          <img v-if="card.createdByPhoto" :src="card.createdByPhoto" class="card-author-avatar" />
          <div v-else class="card-author-avatar-fallback">
            <component :is="User" class="icon-xs" />
          </div>
          <span class="card-author-name">
            {{ card.createdByUid === currentUser.uid ? 'Tú' : card.createdByName.split(' ')[0] }}
          </span>
        </div>
        
        <!-- Delete Button (Card author or Board Creator) -->
        <button 
          v-if="card.createdByUid === currentUser.uid || isCreator" 
          @click="emit('delete')"
          class="card-delete-btn" 
          title="Eliminar Tarjeta"
        >
          &times;
        </button>
      </div>

      <p class="card-text">{{ card.text }}</p>

      <!-- Active voting count controls (in voting & completed) -->
      <div class="card-footer" v-if="boardStatus !== 'brainstorm'">
        <button 
          @click="emit('vote')"
          :class="['vote-btn', 'glass-panel', { 
            'voted-by-me': card.votes?.includes(currentUser.uid),
            'interactive': boardStatus === 'voting'
          }]"
          :disabled="boardStatus !== 'voting'"
          :title="boardStatus === 'voting' ? 'Votar por esta tarjeta' : 'Votos totales'"
        >
          <component :is="ThumbsUp" class="vote-icon" />
          <span class="vote-count">{{ card.votes?.length || 0 }}</span>
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.card-item {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.01);
  transition: all 0.2s ease;
}

.card-item.my-card {
  background: rgba(255, 255, 255, 0.025);
  border-color: rgba(255, 255, 255, 0.12);
}

/* Masked styles */
.card-masked {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 8px;
  text-align: center;
  gap: 8px;
  color: var(--text-muted);
}

.mask-icon {
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.25);
}

.mask-text {
  font-weight: 600;
  font-size: 13px;
  color: var(--text-secondary);
}

.mask-subtext {
  font-size: 10px;
}

.card-user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-author-details {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-author-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.card-author-avatar-fallback {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10px;
}

.card-author-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
}

.card-delete-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.card-delete-btn:hover {
  color: #ef4444;
}

.card-text {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
  word-break: break-word;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
}

.vote-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
  font-size: 12px;
  color: var(--text-secondary);
  border: 1px solid transparent;
}

.vote-btn.interactive {
  cursor: pointer;
}

.vote-btn.interactive:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
}

.vote-btn.voted-by-me {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.35);
  color: #818cf8;
}

.vote-icon {
  width: 12px;
  height: 12px;
}
</style>
