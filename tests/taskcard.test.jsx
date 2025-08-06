import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskCard from '../src/components/TaskCard';

describe('TaskCard', () => {
  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    const dummy = { id: 1, title: 't', status: 'запланировано' };
    const { getByTitle } = render(
      <TaskCard item={dummy} onEdit={() => {}} onDelete={onDelete} onView={() => {}} />
    );
    fireEvent.click(getByTitle('Удалить'));
    expect(onDelete).toHaveBeenCalled();
  });
});
