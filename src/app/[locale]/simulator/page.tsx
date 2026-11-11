import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Simulator } from '@/simulator/components/Simulator';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('simulator.page');
  return { title: t('title') };
}

export default function SimulatorPage() {
  return <Simulator />;
}
