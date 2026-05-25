import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  getDocs,
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';

export const useBoardStore = defineStore('board', () => {
  const boardsList = ref([]);
  const activeBoard = ref(null);
  const activeCards = ref([]);
  const loadingBoards = ref(false);
  const deletingBoardId = ref(null);

  // Computed: boards grouped by temporal state
  const groupedBoards = computed(() => {
    const now = new Date();
    const groups = { active: [], scheduled: [], completed: [] };

    for (const board of boardsList.value) {
      if (board.status === 'completed') {
        groups.completed.push(board);
      } else if (board.scheduledAt) {
        // scheduledAt can be a Firestore Timestamp or an ISO string
        const scheduledDate = board.scheduledAt.toDate
          ? board.scheduledAt.toDate()
          : new Date(board.scheduledAt);
        if (scheduledDate > now) {
          groups.scheduled.push(board);
        } else {
          groups.active.push(board);
        }
      } else {
        groups.active.push(board);
      }
    }

    return groups;
  });

  // Unsubscribe callbacks to prevent memory leaks
  let boardUnsubscribe = null;
  let cardsUnsubscribe = null;

  // Create a new board
  const createBoard = async (name, durationMinutes, participantsStr, customColumns, user, scheduledAt) => {
    try {
      // Clean and split participants
      const participants = participantsStr
        ? participantsStr.split(',').map(email => email.trim().toLowerCase()).filter(email => email.length > 0)
        : [];

      // Ensure the creator is also included in participants (or has access by default)
      if (user.email && !participants.includes(user.email.toLowerCase())) {
        participants.push(user.email.toLowerCase());
      }

      // Default or custom columns
      const columns = customColumns && customColumns.length > 0 
        ? customColumns 
        : [
            { id: 'good', name: '😊 Lo que salió bien', color: 'var(--glass-green)' },
            { id: 'bad', name: '😢 Lo que salió mal', color: 'var(--glass-red)' },
            { id: 'improve', name: '💡 Cosas a mejorar', color: 'var(--glass-yellow)' }
          ];

      const boardData = {
        name,
        createdBy: user.uid,
        createdByEmail: user.email,
        createdByName: user.displayName,
        createdAt: serverTimestamp(),
        status: 'brainstorm', // 'brainstorm' | 'voting' | 'completed'
        durationMinutes: parseInt(durationMinutes) || 15,
        timerStartedAt: null,
        timerExpiresAt: null,
        participants,
        columns,
        actionItems: [],
        scheduledAt: scheduledAt || null
      };

      const docRef = await addDoc(collection(db, 'boards'), boardData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating board:', error);
      throw error;
    }
  };

  // Fetch all boards where the user is creator or listed in participants
  const fetchUserBoards = (userEmail, userUid) => {
    loadingBoards.value = true;
    
    // Query A: Boards created by me
    const qCreated = query(
      collection(db, 'boards'),
      where('createdBy', '==', userUid)
    );

    // Query B: Boards I am invited to as participant
    const qInvited = query(
      collection(db, 'boards'),
      where('participants', 'array-contains', userEmail.toLowerCase())
    );

    const boardsMap = new Map();

    const updateBoardsList = () => {
      const list = Array.from(boardsMap.values());
      // Sort client-side by createdAt descending
      boardsList.value = list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      loadingBoards.value = false;
    };

    // Sub A: Created by me
    const unsubCreated = onSnapshot(qCreated, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'removed') {
          boardsMap.delete(change.doc.id);
        } else {
          boardsMap.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
        }
      });
      updateBoardsList();
    }, (error) => {
      console.error('Error fetching created boards:', error);
      loadingBoards.value = false;
    });

    // Sub B: Invited to
    const unsubInvited = onSnapshot(qInvited, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'removed') {
          // Only remove if it's not also created by me
          const existing = boardsMap.get(change.doc.id);
          if (existing && existing.createdBy !== userUid) {
            boardsMap.delete(change.doc.id);
          }
        } else {
          boardsMap.set(change.doc.id, { id: change.doc.id, ...change.doc.data() });
        }
      });
      updateBoardsList();
    }, (error) => {
      console.error('Error fetching invited boards:', error);
    });

    // Return combined unsubscribe listener
    return () => {
      unsubCreated();
      unsubInvited();
    };
  };

  // Sync a single board in real-time
  const subscribeToBoard = (boardId) => {
    if (boardUnsubscribe) boardUnsubscribe();

    const docRef = doc(db, 'boards', boardId);
    boardUnsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        activeBoard.value = { id: docSnap.id, ...docSnap.data() };
      } else {
        activeBoard.value = null;
      }
    }, (error) => {
      console.error('Error subscribing to board:', error);
    });
  };

  // Sync board cards in real-time
  const subscribeToCards = (boardId) => {
    if (cardsUnsubscribe) cardsUnsubscribe();

    const cardsRef = collection(db, 'boards', boardId, 'cards');
    const q = query(cardsRef, orderBy('createdAt', 'asc'));

    cardsUnsubscribe = onSnapshot(q, (snapshot) => {
      const cards = [];
      snapshot.forEach((doc) => {
        cards.push({ id: doc.id, ...doc.data() });
      });
      activeCards.value = cards;
    }, (error) => {
      console.error('Error subscribing to cards:', error);
    });
  };

  // Cleanup real-time listeners
  const unsubscribeAll = () => {
    if (boardUnsubscribe) {
      boardUnsubscribe();
      boardUnsubscribe = null;
    }
    if (cardsUnsubscribe) {
      cardsUnsubscribe();
      cardsUnsubscribe = null;
    }
    activeBoard.value = null;
    activeCards.value = [];
  };

  // Add a card
  const addCard = async (boardId, columnId, text, user) => {
    try {
      const cardData = {
        columnId,
        text,
        createdByUid: user.uid,
        createdByName: user.displayName,
        createdByPhoto: user.photoURL || '',
        createdAt: serverTimestamp(),
        votes: [] // list of user UIDs
      };
      await addDoc(collection(db, 'boards', boardId, 'cards'), cardData);
    } catch (error) {
      console.error('Error adding card:', error);
      throw error;
    }
  };

  // Delete a card
  const deleteCard = async (boardId, cardId) => {
    try {
      await deleteDoc(doc(db, 'boards', boardId, 'cards', cardId));
    } catch (error) {
      console.error('Error deleting card:', error);
      throw error;
    }
  };

  // Toggle vote on a card (atomic operation)
  const toggleVote = async (boardId, cardId, userUid) => {
    try {
      const cardRef = doc(db, 'boards', boardId, 'cards', cardId);
      const cardSnap = await getDoc(cardRef);
      if (!cardSnap.exists()) return;

      const votes = cardSnap.data().votes || [];
      if (votes.includes(userUid)) {
        await updateDoc(cardRef, {
          votes: arrayRemove(userUid)
        });
      } else {
        await updateDoc(cardRef, {
          votes: arrayUnion(userUid)
        });
      }
    } catch (error) {
      console.error('Error toggling vote:', error);
      throw error;
    }
  };

  // Update Board Phase Status
  const updateBoardStatus = async (boardId, status) => {
    try {
      const boardRef = doc(db, 'boards', boardId);
      const updates = { status };
      
      // If we move to brainstorm, or restart it, clean up timer
      if (status === 'brainstorm') {
        updates.timerStartedAt = null;
        updates.timerExpiresAt = null;
      }
      
      await updateDoc(boardRef, updates);
    } catch (error) {
      console.error('Error updating board status:', error);
      throw error;
    }
  };

  // Start Sync Timer
  const startBoardTimer = async (boardId, durationMinutes) => {
    try {
      const boardRef = doc(db, 'boards', boardId);
      const now = new Date();
      const expires = new Date(now.getTime() + durationMinutes * 60000);
      
      await updateDoc(boardRef, {
        timerStartedAt: now.toISOString(),
        timerExpiresAt: expires.toISOString(),
        durationMinutes: durationMinutes
      });
    } catch (error) {
      console.error('Error starting timer:', error);
      throw error;
    }
  };

  // Clear Synced Timer
  const clearBoardTimer = async (boardId) => {
    try {
      const boardRef = doc(db, 'boards', boardId);
      await updateDoc(boardRef, {
        timerStartedAt: null,
        timerExpiresAt: null
      });
    } catch (error) {
      console.error('Error clearing timer:', error);
      throw error;
    }
  };

  // Update Columns configuration
  const updateBoardColumns = async (boardId, columns) => {
    try {
      const boardRef = doc(db, 'boards', boardId);
      await updateDoc(boardRef, { columns });
    } catch (error) {
      console.error('Error updating board columns:', error);
      throw error;
    }
  };

  // Save AI Generated Analysis (Mood and Actions) on the Board document
  const saveAiAnalysis = async (boardId, { moodSummary, moodEmoji, actionItems }) => {
    try {
      const boardRef = doc(db, 'boards', boardId);
      await updateDoc(boardRef, { moodSummary, moodEmoji, actionItems });
    } catch (error) {
      console.error('Error saving AI analysis:', error);
      throw error;
    }
  };

  // Update Board Custom AI Prompt
  const updateBoardPrompt = async (boardId, aiPrompt) => {
    try {
      const boardRef = doc(db, 'boards', boardId);
      await updateDoc(boardRef, { aiPrompt });
    } catch (error) {
      console.error('Error updating board prompt:', error);
      throw error;
    }
  };

  // Save confirmed Action Plan (enriched actionItems with assignments)
  const saveActionPlan = async (boardId, actionItems) => {
    try {
      const boardRef = doc(db, 'boards', boardId);
      await updateDoc(boardRef, {
        actionItems,
        actionsPlanSaved: true
      });
    } catch (error) {
      console.error('Error saving action plan:', error);
      throw error;
    }
  };

  // Increment AI generation counter (atomic)
  const incrementAiGeneration = async (boardId) => {
    try {
      const boardRef = doc(db, 'boards', boardId);
      await updateDoc(boardRef, {
        aiGenerationCount: increment(1)
      });
    } catch (error) {
      console.error('Error incrementing AI generation count:', error);
      throw error;
    }
  };

  // Update a single action item's status within the board's actionItems array
  const updateActionItemStatus = async (boardId, actionItemId, newStatus) => {
    try {
      const boardRef = doc(db, 'boards', boardId);
      const boardSnap = await getDoc(boardRef);
      if (!boardSnap.exists()) return;

      const currentItems = boardSnap.data().actionItems || [];
      const updatedItems = currentItems.map(item => {
        if (item.id === actionItemId) {
          return {
            ...item,
            status: newStatus,
            completedAt: newStatus === 'done' ? new Date().toISOString() : null
          };
        }
        return item;
      });

      await updateDoc(boardRef, { actionItems: updatedItems });
    } catch (error) {
      console.error('Error updating action item status:', error);
      throw error;
    }
  };

  // Delete a board and all its cards subcollection
  const deleteBoard = async (boardId) => {
    try {
      deletingBoardId.value = boardId;

      // 1. Delete all cards in subcollection (Firestore doesn't cascade-delete)
      const cardsRef = collection(db, 'boards', boardId, 'cards');
      const cardsSnap = await getDocs(cardsRef);
      const deletePromises = cardsSnap.docs.map((cardDoc) =>
        deleteDoc(doc(db, 'boards', boardId, 'cards', cardDoc.id))
      );
      await Promise.all(deletePromises);

      // 2. Delete the board document itself
      await deleteDoc(doc(db, 'boards', boardId));
    } catch (error) {
      console.error('Error deleting board:', error);
      throw error;
    } finally {
      deletingBoardId.value = null;
    }
  };

  return {
    boardsList,
    activeBoard,
    activeCards,
    loadingBoards,
    deletingBoardId,
    groupedBoards,
    createBoard,
    deleteBoard,
    fetchUserBoards,
    subscribeToBoard,
    subscribeToCards,
    unsubscribeAll,
    addCard,
    deleteCard,
    toggleVote,
    updateBoardStatus,
    startBoardTimer,
    clearBoardTimer,
    updateBoardColumns,
    saveAiAnalysis,
    updateBoardPrompt,
    saveActionPlan,
    incrementAiGeneration,
    updateActionItemStatus
  };
});
