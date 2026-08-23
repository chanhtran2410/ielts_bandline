import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-6">
      <EmptyState
        title="That page doesn't exist"
        detail="The link may be out of date. Your progress is unaffected."
        action={<ButtonLink href="/dashboard">Go to your dashboard</ButtonLink>}
      />
    </main>
  );
}
