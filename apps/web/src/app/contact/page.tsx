import { ContactContent } from '@/components/marketing/ContactContent';
import { createLegalMetadata } from '@/lib/legal-metadata';

export const metadata = createLegalMetadata({
  title: 'Contact Us',
  description:
    'Contact Bold support — Lifetop Academy help with meetings, billing, Pro subscriptions, and technical issues. Response within 48 business hours.',
  path: '/contact',
});

export default function ContactPage() {
  return <ContactContent />;
}
