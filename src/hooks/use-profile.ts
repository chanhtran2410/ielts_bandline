'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { StudyGoal } from '@/types/user';
import { queryKeys } from '@/lib/query-client';
import { profileService } from '@/services/profile.service';

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => profileService.getProfile(),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (goal: Partial<StudyGoal>) => profileService.updateGoal(goal),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.profile, profile);
      // The dashboard's band gap and plan both depend on the goal.
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** "Exam in 8 weeks" / "No exam date set". */
export function examCountdownLabel(weeksToExam: number | null): string {
  if (weeksToExam === null) return 'No exam date set';
  if (weeksToExam === 0) return 'Exam this week';
  if (weeksToExam === 1) return 'Exam in 1 week';
  return 'Exam in ' + weeksToExam + ' weeks';
}
