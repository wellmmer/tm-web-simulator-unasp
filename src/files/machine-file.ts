import {
  parseLegacy,
  parseMachine,
  serializeMachine,
  type FormatError,
  type LegacyError,
  type LegacyWarning,
  type Machine,
} from '@/engines/turing';

export type MachineFileError = FormatError | LegacyError;
export type OpenedMachine = { ok: true; machine: Machine; warnings: LegacyWarning[] } | { ok: false; error: MachineFileError };

/** The name "Download" gives the file: the machine's name, without characters that file systems refuse. */
export function machineFileName(name: string): string {
  const safe = name.trim().replace(/[/\\:*?"<>|]/g, '-');
  return `${safe === '' ? 'machine' : safe}.json`;
}

/**
 * Reads a file chosen with "Open file" (spec 5.6). A `.txt` file is a machine from the 2016 app,
 * named after the file. Any other file must be a `computable/machine@1` JSON file.
 */
export function readMachineFile(fileName: string, text: string): OpenedMachine {
  const legacy = fileName.toLowerCase().endsWith('.txt');
  if (!legacy) {
    const result = parseMachine(text);
    return result.ok ? { ok: true, machine: result.machine, warnings: [] } : result;
  }
  const result = parseLegacy(text, fileName.slice(0, -'.txt'.length));
  return result.ok ? { ok: true, machine: result.machine, warnings: result.warnings } : result;
}

/** Saves the machine as `<name>.json` through the browser's download. */
export function downloadMachine(machine: Machine): void {
  const url = URL.createObjectURL(new Blob([serializeMachine(machine)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = machineFileName(machine.name);
  link.click();
  // The browser reads the file after the click returns; free the memory a moment later.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
