// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import tcc2016Text from '../../../examples/example.txt?raw';
import { serializeMachine } from '@/engines/turing';
import { examples } from '../examples';
import { MachineFile } from './MachineFile';
import { renderSimulator } from './test-utils';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const chooseFile = (name: string, text: string) =>
  act(() => fireEvent.change(screen.getByTestId('open-file'), { target: { files: [new File([text], name)] } }));

describe('MachineFile', () => {
  it('shows the machine as JSON', () => {
    renderSimulator(<MachineFile />);
    expect(screen.getByLabelText('The machine file, as JSON').textContent).toBe(serializeMachine(examples['binary-plus-one'].machine));
  });

  it('opens a machine file and a 2016 .txt file', async () => {
    const { store } = renderSimulator(<MachineFile />);
    chooseFile('palindrome.json', serializeMachine(examples.palindrome.machine));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Opened Palindrome checker.'));
    expect(store.getState().exampleId).toBe('palindrome');
    chooseFile('example.txt', tcc2016Text);
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Opened example.'));
    expect(store.getState().machine.leftEdge).toBe('reject');
  });

  it('names the bad field of a machine file, and the line of a bad 2016 file (spec 8)', async () => {
    const { store } = renderSimulator(<MachineFile />);
    chooseFile('broken.json', '{"format": "computable/machine@1", "name": "x"}');
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('This file is not a Computable machine (missing `tape`).'));
    chooseFile('old.txt', 'q0\n1\n0,1\n');
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('This 2016 file has a broken rule on line 3.'));
    expect(store.getState().exampleId).toBe('binary-plus-one');
  });

  it('says so when the browser cannot read the chosen file, and keeps the machine', async () => {
    vi.spyOn(File.prototype, 'text').mockRejectedValue(new DOMException('The file was moved.', 'NotFoundError'));
    const { store } = renderSimulator(<MachineFile />);
    chooseFile('palindrome.json', serializeMachine(examples.palindrome.machine));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('The browser could not read this file. Try to open it again.'));
    expect(store.getState().exampleId).toBe('binary-plus-one');
  });

  it('downloads the machine as <name>.json', () => {
    // jsdom has no object URLs.
    URL.createObjectURL = vi.fn(() => 'blob:machine');
    URL.revokeObjectURL = vi.fn();
    const clicked: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this);
    });
    renderSimulator(<MachineFile />);
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Download' })));
    expect(clicked.map((link) => [link.download, link.href])).toEqual([['Binary +1.json', 'blob:machine']]);
  });

  it('renames the machine without sending the run back to the start, and starts a new machine with no rules', () => {
    const { store } = renderSimulator(<MachineFile />);
    act(() => store.getState().stepForward());
    act(() => fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Adder' } }));
    expect(store.getState().machine.name).toBe('Adder');
    expect(store.getState().run?.steps).toBe(1);
    act(() => fireEvent.click(screen.getByRole('button', { name: 'New machine' })));
    expect(store.getState().machine).toMatchObject({ name: 'My machine', tape: 'one-sided', rules: [] });
  });
});
