// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShareButton } from './ShareButton';
import { renderSimulator } from './test-utils';

const PAGE = '/en/simulator';

beforeEach(() => {
  window.history.replaceState(null, '', PAGE);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ShareButton', () => {
  it('shows the link in a field to copy by hand when the browser blocks copying, and keeps it out of the URL', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: () => Promise.reject(new Error('not allowed')) } });
    renderSimulator(<ShareButton />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy share link' }));
    });
    expect(window.location.hash).toBe('');
    const field = screen.getByRole<HTMLInputElement>('textbox', { name: 'Share link' });
    expect(field.readOnly).toBe(true);
    expect(field.value.startsWith(`${window.location.origin}${PAGE}#m=`)).toBe(true);
    act(() => field.focus());
    expect([field.selectionStart, field.selectionEnd]).toEqual([0, field.value.length]);
  });

  it('says the link was copied when copying works', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    renderSimulator(<ShareButton />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy share link' }));
    });
    expect(writeText).toHaveBeenCalledOnce();
    expect(screen.getByRole('status').textContent).toBe('Link copied.');
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('offers the file download when the machine is too big for a link (spec 5.6)', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:machine');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { store } = renderSimulator(<ShareButton />);
    // Characters that do not repeat, so lz-string cannot make the link short.
    const name = Array.from({ length: 9000 }, (_, i) => String.fromCodePoint(0x4e00 + ((i * 7919) % 20000))).join('');
    act(() => store.getState().loadMachine({ ...store.getState().machine, name }));
    expect(screen.queryByRole('button', { name: 'Download' })).toBeNull();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy share link' }));
    });
    expect(screen.getByRole('status').textContent).toBe('This machine is too big for a link. Download it as a file instead.');
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Download' })));
    expect(click).toHaveBeenCalledOnce();
  });
});
