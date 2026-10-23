import { describe, expect, it } from 'vitest';
import { mergeChatMessages } from './chatMessages';

describe('mergeChatMessages', () => {
  it('deduplicates by message id, preserves messages missing from stale fetches, and sorts chronologically', () => {
    const sentMessage = { id: 3, body: 'Sent', created_at: '2026-10-22T10:03:00Z' };
    const messages = mergeChatMessages(
      [
        { id: 2, body: 'Old', created_at: '2026-10-22T10:02:00Z' },
        sentMessage,
      ],
      [
        { id: 1, body: 'Earlier', created_at: '2026-10-22T10:01:00Z' },
        { id: 2, body: 'Updated', created_at: '2026-10-22T10:02:00Z' },
      ],
    );

    expect(messages).toEqual([
      { id: 1, body: 'Earlier', created_at: '2026-10-22T10:01:00Z' },
      { id: 2, body: 'Updated', created_at: '2026-10-22T10:02:00Z' },
      sentMessage,
    ]);
  });

  it('keeps up to the configured bounded chat history', () => {
    const messages = Array.from({ length: 501 }, (_, id) => ({
      id,
      body: `Message ${id}`,
      created_at: new Date(Date.UTC(2026, 0, 1, 0, id)).toISOString(),
    }));

    expect(mergeChatMessages([], messages)).toHaveLength(500);
    expect(mergeChatMessages([], messages)[0].id).toBe(1);
  });
});
