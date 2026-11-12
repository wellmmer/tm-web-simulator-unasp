// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DiagramButtons } from './DiagramButtons';
import { renderSimulator } from './test-utils';

afterEach(cleanup);

const handlers = () => ({ onZoomIn: vi.fn(), onZoomOut: vi.fn(), onWholeMachine: vi.fn(), onToggleFollow: vi.fn() });

describe('DiagramButtons', () => {
  it('has Zoom in, Zoom out and Whole machine, and no "Follow the run" when following does not apply', () => {
    renderSimulator(<DiagramButtons canFollow={false} following={false} {...handlers()} />);
    expect(screen.getByRole('group', { name: 'Diagram view' })).toBeTruthy();
    expect(screen.getAllByRole('button').map((button) => button.getAttribute('aria-label') ?? button.textContent)).toEqual([
      'Zoom in',
      'Zoom out',
      'Whole machine',
    ]);
  });

  it('shows "Follow the run" as a toggle, pressed while following', () => {
    renderSimulator(<DiagramButtons canFollow following {...handlers()} />);
    expect(screen.getByRole('button', { name: 'Follow the run' }).getAttribute('aria-pressed')).toBe('true');
    cleanup();
    renderSimulator(<DiagramButtons canFollow following={false} {...handlers()} />);
    expect(screen.getByRole('button', { name: 'Follow the run' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('calls one handler per button', () => {
    const calls = handlers();
    renderSimulator(<DiagramButtons canFollow following={false} {...calls} />);
    for (const name of ['Zoom in', 'Zoom out', 'Whole machine', 'Follow the run']) {
      act(() => fireEvent.click(screen.getByRole('button', { name })));
    }
    expect([calls.onZoomIn, calls.onZoomOut, calls.onWholeMachine, calls.onToggleFollow].map((call) => call.mock.calls.length)).toEqual([1, 1, 1, 1]);
  });
});
