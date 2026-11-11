import { IBM_Plex_Sans, JetBrains_Mono, Spectral, STIX_Two_Math } from 'next/font/google';

/** Headings and the step sentence. */
const spectral = Spectral({ subsets: ['latin'], weight: ['400', '600', '800'], variable: '--font-spectral' });

/** Buttons, menus and body text. */
const plexSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-sans' });

/** Tape symbols and rules only. */
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-jetbrains-mono' });

/**
 * Turing's Fraktur state letters (𝔟, 𝔠, 𝔢, 𝔨) are Unicode math letters, which the three fonts above
 * lack. The browser downloads this font only when such a letter is on the page.
 */
const stixMath = STIX_Two_Math({ weight: '400', variable: '--font-math' });

/** The class names that define the four font variables on <html>. */
export const fontVariables = [spectral, plexSans, jetbrainsMono, stixMath].map((font) => font.variable).join(' ');
