// @vitest-environment jsdom
import { cleanup, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TCC_PAPER_URL, TCC_TAG_URL } from '@/config/links';
import { renderWithIntl } from '@/test/intl';
import AboutPage from './page';

afterEach(cleanup);

describe('About (spec 4.2)', () => {
  it('names the 2016 project, its school, author and advisor', () => {
    renderWithIntl(<AboutPage />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('About Computable');
    const record = screen.getByRole('region', { name: 'The 2016 project' });
    const facts = within(record)
      .getAllByRole('term')
      .map((term) => [term.textContent, term.nextElementSibling?.textContent]);
    expect(facts).toEqual([
      ['Title', 'Simulador de Máquina de Turing, Uma Aplicação Web para o Ensino(A Turing machine simulator: a web app for teaching)'],
      ['School', 'UNASP, Computer Science'],
      ['Year', '2016'],
      ['Author', 'Wellmmer Lucas de Oliveira Pinto'],
      ['Advisor', 'Prof. Laercio Martins Carpes'],
    ]);
  });

  it('links the 2016 paper and the v1.0-tcc-2016 tag', () => {
    renderWithIntl(<AboutPage />);
    expect(screen.getByRole('link', { name: 'Read the 2016 paper (PDF, in Portuguese)' }).getAttribute('href')).toBe(TCC_PAPER_URL);
    expect(screen.getByRole('link', { name: "See the 2016 app's code at the git tag v1.0-tcc-2016" }).getAttribute('href')).toBe(TCC_TAG_URL);
    expect(TCC_PAPER_URL).toBe(
      'https://github.com/wellmmer/computable/blob/master/docs/tcc/paper/TCC%20-%20Simulador%20de%20M%C3%A1quina%20de%20Turing%2C%20Uma%20Aplica%C3%A7%C3%A3o%20Web%20para%20o%20Ensino.pdf',
    );
  });
});
