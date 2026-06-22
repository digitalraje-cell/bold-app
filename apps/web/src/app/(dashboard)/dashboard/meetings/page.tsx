import { redirect } from 'next/navigation';

export default function DashboardMeetingsRedirect() {
  redirect('/meetings');
}
