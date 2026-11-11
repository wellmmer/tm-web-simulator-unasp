// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Controls } from './Controls';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { renderSimulator } from './test-utils';

beforeAll(() => {
  // jsdom has <dialog> but not showModal() or close().
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
  };
});

afterEach(cleanup);

const press = (key: string, target: Element = document.body) => act(() => fireEvent.keyDown(target, { key }));

describe('Controls', () => {
  it('has Reset, Step back, Run and Step buttons, each with its key', () => {
    renderSimulator(<Controls />);
    for (const [name, key] of [
      ['Reset', 'r'],
      ['Step back', 'ArrowLeft'],
      ['Run', 'Space'],
      ['Step', 'ArrowRight'],
    ]) {
      expect(screen.getByRole('button', { name }).getAttribute('aria-keyshortcuts')).toBe(key);
    }
  });

  it('steps, then steps back, from the buttons', () => {
    const { store } = renderSimulator(<Controls />);
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Step back' }).disabled).toBe(true);
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Step' })));
    expect(store.getState().run?.steps).toBe(1);
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Step back' })));
    expect(store.getState().run?.steps).toBe(0);
  });

  it('turns Run into Pause while the machine runs', () => {
    const { store } = renderSimulator(<Controls />);
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Run' })));
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
    act(() => store.getState().pause());
  });

  it('changes the speed with the buttons and the slider', () => {
    const { store } = renderSimulator(<Controls />);
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Faster' })));
    expect(store.getState().speed).toBe(4);
    act(() => fireEvent.change(screen.getByRole('slider', { name: 'Speed' }), { target: { value: '1' } }));
    expect(store.getState().speed).toBe(1);
    expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toBe('1 of 5');
  });
});

describe('KeyboardShortcuts', () => {
  it('steps with the arrow keys, resets with R and changes speed with + and -', () => {
    const { store } = renderSimulator(<KeyboardShortcuts />);
    press('ArrowRight');
    press('ArrowRight');
    press('ArrowLeft');
    expect(store.getState().run?.steps).toBe(1);
    press('r');
    expect(store.getState().run?.steps).toBe(0);
    press('+');
    expect(store.getState().speed).toBe(4);
    press('-');
    press('-');
    expect(store.getState().speed).toBe(2);
  });

  it('runs and pauses with Space', () => {
    const { store } = renderSimulator(<KeyboardShortcuts />);
    press(' ');
    expect(store.getState().loop).toBe('running');
    press(' ');
    expect(store.getState().loop).toBe('idle');
  });

  it('ignores key repeat for Space, R and ?, but keeps it for the arrow keys', () => {
    const { store } = renderSimulator(<KeyboardShortcuts />);
    const hold = (key: string) => act(() => fireEvent.keyDown(document.body, { key, repeat: true }));
    hold('ArrowRight');
    hold('ArrowRight');
    expect(store.getState().run?.steps).toBe(2);
    hold('r');
    hold('R');
    expect(store.getState().run?.steps).toBe(2);
    press(' ');
    hold(' ');
    hold(' ');
    expect(store.getState().loop).toBe('running');
    act(() => store.getState().pause());
    hold('?');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is off while focus is in a text field', () => {
    const { store } = renderSimulator(
      <>
        <input aria-label="Input" />
        <KeyboardShortcuts />
      </>,
    );
    const field = screen.getByRole('textbox', { name: 'Input' });
    press('ArrowRight', field);
    press(' ', field);
    press('r', field);
    expect(store.getState()).toMatchObject({ loop: 'idle', run: { steps: 0 } });
  });

  it('ignores keys pressed with Ctrl, Alt or Cmd', () => {
    const { store } = renderSimulator(<KeyboardShortcuts />);
    act(() => fireEvent.keyDown(document.body, { key: 'r', metaKey: true }));
    act(() => fireEvent.keyDown(document.body, { key: 'ArrowRight', altKey: true }));
    expect(store.getState().run?.steps).toBe(0);
  });

  it('lists every shortcut when ? is pressed', () => {
    renderSimulator(<KeyboardShortcuts />);
    press('?');
    const dialog = screen.getByRole('dialog', { name: 'Keyboard shortcuts' });
    expect(dialog.textContent).toContain('Run or pause');
    expect(dialog.textContent).toContain('Shortcuts are off while you type in a text field.');
  });
});
