import type de from '../../messages/de.json';
import type en from '../../messages/en.json';
import type es from '../../messages/es.json';
import type fr from '../../messages/fr.json';
import type ptBR from '../../messages/pt-BR.json';

/**
 * Spec 10: a missing string fails the build. `next build` and `npm run typecheck` check this file:
 * a language file that lacks a key of en.json is not a `typeof en`, so the type check fails and
 * names the key. src/i18n/messages.test.ts also refuses extra keys and broken texts.
 */
type HasEveryKey<Messages extends typeof en> = Messages;

export type CheckedMessages = [HasEveryKey<typeof ptBR>, HasEveryKey<typeof es>, HasEveryKey<typeof fr>, HasEveryKey<typeof de>];
