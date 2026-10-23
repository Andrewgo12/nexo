import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import InterviewRecorderModal from './InterviewRecorderModal';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('InterviewRecorderModal', () => {
  it('copies unanswered interview fields as unanswered instead of inventing affirmative answers', async () => {
    const writeText = vi.fn().mockResolvedValue();
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    render(<InterviewRecorderModal isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copiar' }));

    expect(await screen.findByText('Copiado')).toBeTruthy();
    const [summary] = writeText.mock.calls[0];
    expect(summary).toContain('Q1 Permiso grabación: Sin respuesta');
    expect(summary).toContain('Q5 Nivel de seguridad (1-5): Sin respuesta');
    expect(summary).toContain('Q10 Usaría la app ViajaU: Sin respuesta');
    expect(summary).toContain('Q12 Pagaría micro-seguro AXA ($2.000-$5.000): Sin respuesta');
  });

  it('reports clipboard failures instead of showing a copied confirmation', async () => {
    const error = new Error('Permission denied');
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: vi.fn().mockRejectedValue(error) },
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<InterviewRecorderModal isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Copiar' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Permission denied');
    expect(screen.queryByText('Copiado')).toBeNull();
  });
});
