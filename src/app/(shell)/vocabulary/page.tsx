import type { Metadata } from 'next';
import { PageBody, PageHeader } from '@/components/layout/app-shell';
import { ButtonLink } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { EmptyState } from '@/components/ui/states';

export const metadata: Metadata = { title: 'Vocabulary' };

/**
 * Vocabulary is in the approved navigation but has no approved screen. Rather
 * than invent a UX for it (§3), this states honestly where the feature stands
 * and routes the learner to the vocabulary work that does exist.
 */
export default function VocabularyPage() {
  return (
    <PageBody>
      <PageHeader
        title="Vocabulary"
        description="Your lexical resource is measured from every essay you submit and every completion question you answer."
      />
      <EmptyState
        title="Vocabulary drills are not built yet"
        detail="In the meantime, your vocabulary and collocation mistakes are already collected in the Error Bank — that is where the marks are being lost."
        icon={<Icon name="bookmark" size={16} />}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <ButtonLink href="/mistakes">Open the Error Bank</ButtonLink>
            <ButtonLink href="/progress" variant="secondary">
              See your lexical trend
            </ButtonLink>
          </div>
        }
      />
    </PageBody>
  );
}
