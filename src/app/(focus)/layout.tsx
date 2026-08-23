/**
 * Focused sessions: reading practice, mock exams, the writing editor and the
 * result screens. No sidebar — nothing here should invite the learner away.
 */
export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return <div id="main">{children}</div>;
}
