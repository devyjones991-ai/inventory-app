import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { linkifyText } from '../src/utils/linkify';

// Tests to ensure malicious HTML is not executed and links are created safely

describe('linkifyText', () => {
  it('does not execute malicious HTML and renders it as text', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { container } = render(<div>{linkifyText('<img src=x onerror=alert(1)>')}</div>);
    expect(container.querySelector('img')).toBeNull();
    expect(alertMock).not.toHaveBeenCalled();
    alertMock.mockRestore();
  });

  it('creates clickable links for URLs', () => {
    const { container } = render(
      <div>{linkifyText('Visit https://example.com and www.test.com now')}</div>
    );
    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('href')).toBe('https://example.com');
    expect(links[0].textContent).toBe('https://example.com');
    expect(links[1].getAttribute('href')).toBe('http://www.test.com');
    expect(links[1].textContent).toBe('www.test.com');
  });
});
