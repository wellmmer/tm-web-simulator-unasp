// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SupportHandles } from '@/config/support';
import { renderWithIntl } from '@/test/intl';
import { pixCode } from './pix';
import { SupportView } from './SupportView';

const ALL: SupportHandles = {
  paypal: 'devname',
  kofi: 'devname',
  pix: { key: 'dev@example.com', name: 'Dev Name', city: 'Sao Paulo' },
  revolutLink: 'https://revolut.me/devname',
  wiseLink: 'https://wise.com/pay/me/devname',
  githubSponsorsLink: 'https://github.com/sponsors/devname',
};

const NONE: SupportHandles = {
  paypal: '',
  kofi: '',
  pix: { key: '', name: '', city: '' },
  revolutLink: '',
  wiseLink: '',
  githubSponsorsLink: '',
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('SupportView (spec 7)', () => {
  it('says so honestly while no handle is filled in, with no amount and no link', () => {
    renderWithIntl(<SupportView handles={NONE} />);
    expect(screen.getByText('The payment links are not ready yet. Thank you for wanting to help.')).toBeTruthy();
    expect(screen.queryByRole('radio')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('starts at $5 and puts the chosen amount in the PayPal link', () => {
    renderWithIntl(<SupportView handles={ALL} />);
    const amounts = within(screen.getByRole('group', { name: 'Amount, in US dollars' })).getAllByRole('radio');
    expect(amounts.map((radio) => radio.closest('label')?.textContent)).toEqual(['$1', '$3', '$5', '$10', 'Other']);
    expect(screen.getByRole('radio', { name: '$5' })).toHaveProperty('checked', true);
    expect(screen.getByRole('link', { name: 'Pay $5 with PayPal' }).getAttribute('href')).toBe('https://paypal.me/devname/5USD');
    expect(screen.getByText('The link fills in $5.')).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: '$10' }));
    expect(screen.getByRole('link', { name: 'Pay $10 with PayPal' }).getAttribute('href')).toBe('https://paypal.me/devname/10USD');
    expect(screen.getByRole('link', { name: 'Open Ko-fi' }).getAttribute('href')).toBe('https://ko-fi.com/devname');
    // Ko-fi, Revolut, Wise and GitHub Sponsors take no amount in the link.
    expect(screen.getAllByText('Type $10 on the next page.')).toHaveLength(4);
  });

  it('takes another amount of $1 or more', () => {
    renderWithIntl(<SupportView handles={ALL} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Other' }));
    const field = screen.getByRole('textbox', { name: 'Other amount, in US dollars' });
    fireEvent.change(field, { target: { value: '0.50' } });
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(screen.queryByRole('link', { name: /with PayPal/ })).toBeNull();
    fireEvent.change(field, { target: { value: '7.5' } });
    expect(field.getAttribute('aria-invalid')).toBe('false');
    expect(screen.getByRole('link', { name: 'Pay $7.50 with PayPal' }).getAttribute('href')).toBe('https://paypal.me/devname/7.50USD');
  });

  it('keeps Pix, Revolut, Wise and GitHub Sponsors under "More ways to pay"', () => {
    renderWithIntl(<SupportView handles={ALL} />);
    const more = screen.getByText('More ways to pay').closest('details');
    if (more === null) throw new Error('no "More ways to pay" section');
    expect(more.open).toBe(false);
    expect(within(more).getByRole('img', { name: 'Pix QR code' })).toBeTruthy();
    expect(within(more).getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Open Revolut', 'https://revolut.me/devname'],
      ['Open Wise', 'https://wise.com/pay/me/devname'],
      ['Open GitHub Sponsors', 'https://github.com/sponsors/devname'],
    ]);
  });

  it('copies the Pix code, and shows it in a field to copy by hand', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    renderWithIntl(<SupportView handles={ALL} />);
    const code = pixCode(ALL.pix);
    expect(screen.getByRole('textbox', { name: 'Pix code' })).toHaveProperty('value', code);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy the Pix code' })));
    expect(writeText).toHaveBeenCalledWith(code);
    expect(screen.getByRole('status').textContent).toBe('Copied.');
  });

  it('says so when the browser does not allow copying', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) } });
    renderWithIntl(<SupportView handles={ALL} />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy the Pix code' })));
    expect(screen.getByRole('status').textContent).toBe('Your browser did not allow copying. Copy the code from the field.');
  });
});
