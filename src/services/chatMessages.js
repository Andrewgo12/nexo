export const MAX_CHAT_HISTORY = 500;

export function mergeChatMessages(currentMessages, incomingMessages, limit = MAX_CHAT_HISTORY) {
  const messagesById = new Map();
  for (const message of [...currentMessages, ...incomingMessages]) {
    if (!message || message.id == null || typeof message.body !== 'string') {
      throw new TypeError('El historial contiene un mensaje con formato inválido.');
    }
    messagesById.set(String(message.id), message);
  }

  return [...messagesById.values()]
    .sort((first, second) => {
      const firstTime = Date.parse(first.created_at);
      const secondTime = Date.parse(second.created_at);
      if (Number.isFinite(firstTime) && Number.isFinite(secondTime) && firstTime !== secondTime) {
        return firstTime - secondTime;
      }

      const firstId = Number(first.id);
      const secondId = Number(second.id);
      if (Number.isFinite(firstId) && Number.isFinite(secondId)) return firstId - secondId;
      return String(first.id).localeCompare(String(second.id));
    })
    .slice(-limit);
}
