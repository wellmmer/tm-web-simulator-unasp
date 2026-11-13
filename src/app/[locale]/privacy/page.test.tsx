// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderWithIntl } from '@/test/intl';
import PrivacyPage from './page';

afterEach(cleanup);

describe('Privacy (spec 4.2)', () => {
  it('says what stays in the browser, what the site counts and how donations work', () => {
    renderWithIntl(<PrivacyPage />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Privacy');
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      'What stays in your browser',
      'What the site counts',
      'Donations',
    ]);
    expect(screen.getByText(/the site counts visits with Vercel Web Analytics\. It sets no cookies\./)).toBeTruthy();
  });

  it("links the analytics service's privacy notes and the repo's issues", () => {
    renderWithIntl(<PrivacyPage />);
    expect(screen.getByRole('link', { name: 'How Vercel Web Analytics handles privacy' }).getAttribute('href')).toBe(
      'https://vercel.com/docs/analytics/privacy-policy',
    );
    expect(screen.getByRole('link', { name: 'Open an issue on GitHub' }).getAttribute('href')).toBe(
      'https://github.com/wellmmer/tm-web-simulator-unasp/issues',
    );
  });
});
