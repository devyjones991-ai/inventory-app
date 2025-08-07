import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import InventorySidebar from '../src/components/InventorySidebar.jsx';

describe('InventorySidebar', () => {
  const objects = [
    { id: 1, name: 'Первый' },
    { id: 2, name: 'Второй' },
  ];
  const notifications = { 1: 5 };

  it('вызывает onSelect и добавляет активный класс', () => {
    const handleSelect = vi.fn();
    function Wrapper() {
      const [selected, setSelected] = React.useState(null);
      return (
        <InventorySidebar
          objects={objects}
          selected={selected}
          onSelect={(o) => {
            handleSelect(o);
            setSelected(o);
          }}
          onEdit={() => {}}
          onDelete={() => {}}
          notifications={notifications}
        />
      );
    }

    render(<Wrapper />);

    const first = screen.getByText('Первый');
    fireEvent.click(first);

    expect(handleSelect).toHaveBeenCalledWith(objects[0]);
    expect(first).toHaveClass('border-b-2', 'border-primary', 'font-medium');
  });

  it('показывает счётчик уведомлений', () => {
    render(
      <InventorySidebar
        objects={objects}
        selected={null}
        onSelect={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
        notifications={notifications}
      />
    );

    const badge = screen.getByText('5');
    expect(badge).toBeInTheDocument();
  });
});
