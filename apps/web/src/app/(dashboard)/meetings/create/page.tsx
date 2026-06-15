import { Suspense } from 'react';
import { CreateMeetingForm } from '@/components/dashboard/CreateMeetingForm';

export default function CreateMeetingPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <CreateMeetingForm />
    </Suspense>
  );
}
