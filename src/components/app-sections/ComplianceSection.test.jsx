import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ComplianceSection from './ComplianceSection';

describe('ComplianceSection', () => {
  it('shows implementation limits without presenting manual checklist state as coverage', () => {
    render(
      <ComplianceSection
        executionState={[{ id: 'example', label: 'Tarea editable', done: true }]}
        onToggleTask={vi.fn()}
      />,
    );

    expect(screen.getByText(/No se publica un porcentaje de cobertura/)).toBeTruthy();
    expect(screen.getByText(/No evaluada ni certificada/)).toBeTruthy();
    expect(screen.getByText(/1\/1 tareas marcadas en esta instancia/)).toBeTruthy();
    expect(screen.queryByText(/97%|Listo para producción/)).toBeNull();
  });
});
