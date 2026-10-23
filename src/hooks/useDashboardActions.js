import { useEffect, useRef } from 'react';
import { getAuthToken, getTripMessages, sendTripMessage } from '../services/authApi';
import { MAX_CHAT_HISTORY, mergeChatMessages } from '../services/chatMessages';

export default function useDashboardActions(state) {
  const { chatDraft, selectedChatTripId, setChatAction, setChatDraft, setChatError, setChatMessages } = state;
  const selectedTripIdRef = useRef(selectedChatTripId);
  const sendingRef = useRef(false);
  const loadingOlderRef = useRef(false);
  useEffect(() => {
    selectedTripIdRef.current = selectedChatTripId;
  }, [selectedChatTripId]);

  const selectDashboardConversation = (tripId) => {
    selectedTripIdRef.current = tripId;
    state.setChatDraft('');
    state.setChatHasOlder(false);
    state.setSelectedChatTripId(tripId);
  };

  const loadOlderChatMessages = async () => {
    const oldestId = Number(state.chatMessages[0]?.id);
    if (
      !selectedChatTripId
      || !state.chatHasOlder
      || state.chatLoadingOlder
      || loadingOlderRef.current
    ) return;
    if (!Number.isSafeInteger(oldestId) || oldestId <= 0) {
      setChatError('No se pudo determinar el cursor de los mensajes anteriores.');
      return;
    }

    const tripId = selectedChatTripId;
    loadingOlderRef.current = true;
    state.setChatLoadingOlder(true);
    setChatError('');
    try {
      const response = await getTripMessages(
        tripId,
        getAuthToken(),
        undefined,
        { beforeId: oldestId },
      );
      if (!Array.isArray(response.data)) {
        throw new Error('El servidor devolvió mensajes anteriores inválidos.');
      }
      if (selectedTripIdRef.current === tripId) {
        const mergedMessages = mergeChatMessages(state.chatMessages, response.data, MAX_CHAT_HISTORY);
        setChatMessages((current) => mergeChatMessages(current, response.data, MAX_CHAT_HISTORY));
        state.setChatHasOlder(Boolean(response.meta?.has_older) && mergedMessages.length < MAX_CHAT_HISTORY);
      }
    } catch (error) {
      if (selectedTripIdRef.current === tripId) {
        setChatError(error.message || 'No fue posible cargar mensajes anteriores.');
      }
    } finally {
      loadingOlderRef.current = false;
      state.setChatLoadingOlder(false);
    }
  };

  const submitDashboardMessage = async (event) => {
    event.preventDefault();
    if (!selectedChatTripId || !chatDraft.trim() || sendingRef.current) return;
    const tripId = selectedChatTripId;
    sendingRef.current = true;
    setChatAction(true);
    setChatError('');
    try {
      const response = await sendTripMessage(Number(tripId), chatDraft.trim());
      if (!response.data || response.data.id == null || typeof response.data.body !== 'string') {
        throw new Error('El servidor devolvió un mensaje inválido.');
      }
      if (selectedTripIdRef.current === tripId) {
        setChatMessages((current) => mergeChatMessages(current, [response.data]));
        setChatDraft('');
      }
    } catch (error) {
      if (selectedTripIdRef.current === tripId) {
        setChatError(error.message || 'No fue posible enviar el mensaje.');
      }
    } finally {
      sendingRef.current = false;
      setChatAction(false);
    }
  };

  return {
    loadOlderChatMessages,
    selectDashboardConversation,
    submitDashboardMessage,
  };

}
