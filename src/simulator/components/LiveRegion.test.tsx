// @vitest-environment jsdom
import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LiveRegion } from './LiveRegion';
import { renderSimulator } from './test-utils';

afterEach(cleanup);

describe('LiveRegion', () => {
  it('puts new text in the live region when the same announcement comes twice in a row', () => {
    const { store } = renderSimulator(<LiveRegion />);
    act(() => store.getState().stepForward());
    const first = store.getState().announcement;
    if (first === null) throw new Error('expected an announcement');
    const region = screen.getByRole('status');
    const before = region.firstChild;
    // The same words with a new id, as at steps 4 and 7 of Binary +1.
    act(() => store.setState({ announcement: { messages: first.messages, id: first.id + 1 } }));
    expect(region.textContent).toBe(before?.textContent);
    expect(region.firstChild).not.toBe(before);
  });
});
