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

  it('takes another amount from $1 to $10000, and says the rule', () => {
    renderWithIntl(<SupportView handles={ALL} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Other' }));
    const field = screen.getByRole('textbox', { name: 'Other amount, in US dollars' });
    fireEvent.change(field, { target: { value: '0.50' } });
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Type an amount from $1 to $10000, with up to 2 decimals and no thousands separator, like 5 or 5.50.')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /with PayPal/ })).toBeNull();
    // A disabled button, so screen readers say that it is unavailable.
    expect(screen.getByRole('button', { name: 'Pay with PayPal' })).toHaveProperty('disabled', true);
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

  it('shows reais in Brazilian Portuguese, R$ 25 first, and both PayPal and Pix carry the amount', () => {
    renderWithIntl(<SupportView handles={ALL} />, 'pt-BR');
    const amounts = within(screen.getByRole('group', { name: 'Amount, in Brazilian reais' })).getAllByRole('radio');
    expect(amounts.map((radio) => radio.closest('label')?.textContent)).toEqual(['R$\u00a05', 'R$\u00a010', 'R$\u00a025', 'R$\u00a050', 'Other']);
    expect(screen.getByRole('radio', { name: 'R$\u00a025' })).toHaveProperty('checked', true);
    expect(screen.getByRole('link', { name: 'Pay R$\u00a025 with PayPal' }).getAttribute('href')).toBe('https://paypal.me/devname/25BRL');
    expect(screen.getByRole('textbox', { name: 'Pix code' })).toHaveProperty('value', pixCode(ALL.pix, 25));
    // getByText turns the no-break space after R$ into a plain space.
    expect(screen.getByText('The code holds R$ 25. Scan it or copy it, then confirm the payment in your bank app.')).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: 'R$\u00a050' }));
    expect(screen.getByRole('link', { name: 'Pay R$\u00a050 with PayPal' }).getAttribute('href')).toBe('https://paypal.me/devname/50BRL');
    expect(screen.getByRole('textbox', { name: 'Pix code' })).toHaveProperty('value', pixCode(ALL.pix, 50));
  });

  it('takes another amount in reais from R$ 5 to R$ 50000, with a decimal comma', () => {
    renderWithIntl(<SupportView handles={ALL} />, 'pt-BR');
    fireEvent.click(screen.getByRole('radio', { name: 'Other' }));
    const field = screen.getByRole('textbox', { name: 'Other amount, in Brazilian reais' });
    fireEvent.change(field, { target: { value: '4,99' } });
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(
      screen.getByText('Type an amount from R$ 5 to R$ 50000, with up to 2 decimals and no thousands separator, like 25 or 25,50.'),
    ).toBeTruthy();
    // Without a valid amount, the Pix code holds none, and the donor types it in the bank app.
    expect(screen.getByRole('textbox', { name: 'Pix code' })).toHaveProperty('value', pixCode(ALL.pix));
    expect(screen.getByText('Pix moves Brazilian reais. Scan the code or copy it, then type the amount in your bank app.')).toBeTruthy();

    fireEvent.change(field, { target: { value: 'R$ 30,50' } });
    expect(screen.getByRole('link', { name: 'Pay R$\u00a030,50 with PayPal' }).getAttribute('href')).toBe('https://paypal.me/devname/30.50BRL');
    expect(screen.getByRole('textbox', { name: 'Pix code' })).toHaveProperty('value', pixCode(ALL.pix, 30.5));
  });

  it('keeps US dollars in the other languages, so Pix holds no amount there', () => {
    renderWithIntl(<SupportView handles={ALL} />, 'de');
    expect(screen.getByRole('radio', { name: '5\u00a0$' })).toHaveProperty('checked', true);
    expect(screen.getByRole('link', { name: 'Pay 5\u00a0$ with PayPal' }).getAttribute('href')).toBe('https://paypal.me/devname/5USD');
    expect(screen.getByRole('textbox', { name: 'Pix code' })).toHaveProperty('value', pixCode(ALL.pix));
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
