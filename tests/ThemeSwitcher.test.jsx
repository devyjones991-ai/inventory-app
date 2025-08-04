import { render, screen, fireEvent } from '@testing-library/react';
import ThemeSwitcher from '../src/components/ThemeSwitcher';
import { describe, it, expect, beforeEach } from 'vitest';

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    document.documentElement.setAttribute('data-theme', '');
    localStorage.clear();
  });

  it('applies selected theme', () => {
    render(<ThemeSwitcher />);
    const select = screen.getByLabelText(/Тема/i);
    fireEvent.change(select, { target: { value: 'dark' } });
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
