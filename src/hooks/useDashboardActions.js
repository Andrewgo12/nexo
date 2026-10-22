import { sendTripMessage } from '../services/authApi';

export default function useDashboardActions(state) {
  const { chatDraft, selectedChatTripId, setChatAction, setChatDraft, setChatError, setChatMessages } = state;

  const submitDashboardMessage = async (event) => {
      event.preventDefault();
      if (!selectedChatTripId || !chatDraft.trim()) return;
      setChatAction(true);
      setChatError('');
      try {
        const response = await sendTripMessage(Number(selectedChatTripId), chatDraft.trim());
        setChatMessages((current) => [...current, response.data].slice(-100));
        setChatDraft('');
      } catch (error) {
        setChatError(error.message || 'No fue posible enviar el mensaje.');
      } finally {
        setChatAction(false);
      }
    }

  return {
    submitDashboardMessage,
  };

}
