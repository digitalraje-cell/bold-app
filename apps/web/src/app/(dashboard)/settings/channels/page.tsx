import { redirect } from 'next/navigation';

export default function ConnectedChannelsRedirectPage() {
  redirect('/settings/integrations');
}
