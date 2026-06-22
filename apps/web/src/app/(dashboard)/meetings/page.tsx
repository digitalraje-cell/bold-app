import { MeetingsPageContent } from '@/components/dashboard/MeetingsPageContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function MeetingsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <MeetingsPageContent />
    </div>
  );
}
