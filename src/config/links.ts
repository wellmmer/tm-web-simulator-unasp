/** The public repo. The footer, About and Privacy link to it. */
export const REPO_URL = 'https://github.com/wellmmer/tm-web-simulator-unasp';

/** Questions and bug reports. */
export const ISSUES_URL = `${REPO_URL}/issues`;

/** The 2016 app's code, kept at a git tag (spec 4.1). */
export const TCC_TAG_URL = `${REPO_URL}/tree/v1.0-tcc-2016`;

/** The 2016 capstone paper, a PDF in Portuguese. */
export const TCC_PAPER_URL = `${REPO_URL}/blob/master/docs/tcc/paper/${encodeURIComponent(
  'TCC - Simulador de Máquina de Turing, Uma Aplicação Web para o Ensino.pdf',
)}`;

/**
 * GitHub's page to edit a language file. For a visitor who cannot write to the repo, GitHub forks it
 * and opens a pull request (checked: GitHub Docs, "Editing files").
 */
export function translationEditUrl(locale: string): string {
  return `${REPO_URL}/edit/master/messages/${locale}.json`;
}
