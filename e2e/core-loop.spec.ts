import { expect, test } from '@playwright/test';

/**
 * The two critical journeys from §28, driven in a real browser.
 *
 * These assert on what the learner can *see and do*, never on class names, so
 * they survive styling changes but fail if the loop breaks.
 */

test.describe('journey: onboarding to diagnostic to result to recommended practice', () => {
  test('a learner can set a goal, sit the diagnostic, and act on the result', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Stop guessing');

    // Landing -> onboarding
    await page.getByRole('link', { name: 'Find My IELTS Level' }).first().click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('What band do you need?');

    // Step 1: target band
    await page.getByRole('radio', { name: /Band 7\.0/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 2: exam date
    await expect(page.getByRole('heading', { level: 1 })).toContainText('When is your exam?');
    await page.getByRole('radio', { name: /In about 8 weeks/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 3: daily time
    await expect(page.getByRole('heading', { level: 1 })).toContainText('How long can you study');
    await page.getByRole('radio', { name: /45 minutes/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 4: self-assessed weakness (multi-select)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('weakest');
    await page.getByRole('checkbox', { name: /Writing/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 5: the summary reflects what was chosen
    await expect(page.getByText('7.0')).toBeVisible();
    await expect(page.getByText('45 minutes')).toBeVisible();

    // Start the diagnostic — a real timed attempt
    await page.getByRole('button', { name: 'Start diagnostic' }).click();
    await expect(page.getByRole('heading', { name: /Rethinking the Eight-Hour Night/ })).toBeVisible({
      timeout: 20_000,
    });

    // On narrow viewports the passage and questions are separate panes, so the
    // questions have to be brought into view first (§20).
    const questionsTab = page.getByRole('tab', { name: /questions/i });
    if (await questionsTab.isVisible()) await questionsTab.click();

    // Answer the first choice question, and confirm the navigator reflects it
    await page.getByText('It removed the gap between two sleeps.').click();
    await expect(page.getByText(/1 of 13 answered/)).toBeVisible();

    // Submit, confirming through the "are you sure" guard
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('dialog')).toContainText('unanswered');
    await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();

    // The result explains, not just scores
    await expect(page.getByText('Estimated band')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Question type performance')).toBeVisible();
    await expect(page.getByText('Skill analysis')).toBeVisible();
    await expect(page.getByText('Biggest weakness')).toBeVisible();

    // And it offers the next action
    await expect(page.getByRole('link', { name: 'Practice this skill' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Review mistakes' })).toBeVisible();
  });

  test('the dashboard answers the four questions that matter', async ({ page }) => {
    await page.goto('/dashboard');

    // Where am I, and how far to go?
    await expect(page.getByText('Current estimated band')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Target band')).toBeVisible();

    // What is my biggest weakness?
    await expect(page.getByText('Biggest blocker')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Fix this weakness' })).toBeVisible();

    // What should I do next?
    await expect(page.getByRole('heading', { name: /Today.s plan/ })).toBeVisible();

    // Am I improving?
    await expect(page.getByRole('heading', { name: 'Recent progress' })).toBeVisible();
  });

  test('a plan task can be ticked off and stays ticked', async ({ page }) => {
    await page.goto('/dashboard');
    const task = page.getByRole('button', { name: /^Not completed: Grammar Error Review/ });
    await expect(task).toBeVisible({ timeout: 20_000 });

    await task.click();
    await expect(
      page.getByRole('button', { name: /^Completed: Grammar Error Review/ }),
    ).toBeVisible();
  });
});

test.describe('journey: writing to AI feedback to Error Bank', () => {
  test('an essay yields structured feedback that links into the Error Bank', async ({ page }) => {
    await page.goto('/writing/sub_task2_d2/analysis');

    // Band and all four criteria, scoped to the breakdown so the per-criterion
    // detail cards below cannot satisfy the assertion by accident.
    await expect(page.getByText('Estimated band')).toBeVisible({ timeout: 20_000 });
    const breakdown = page.getByRole('region', { name: 'Criteria breakdown' });
    for (const criterion of [
      'Task Response',
      'Coherence & Cohesion',
      'Lexical Resource',
      'Grammatical Range & Accuracy',
    ]) {
      await expect(breakdown.getByText(criterion, { exact: true })).toBeVisible();
    }

    // Sentence-level issues are activatable and explain themselves
    await expect(page.getByRole('heading', { name: 'Sentence-level feedback' })).toBeVisible();
    await page.getByRole('button', { name: /grammar issue/i }).first().click();
    await expect(page.getByText('Why', { exact: true })).toBeVisible();
    await expect(page.getByText('Better', { exact: true })).toBeVisible();

    // The ladder shows the same idea at three levels
    await expect(page.getByRole('heading', { name: 'Raise this sentence' })).toBeVisible();
    await expect(page.getByText('Higher-band alternative')).toBeVisible();

    // And it hands off into the Error Bank
    await page.getByRole('link', { name: 'Open in Error Bank' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Subject–Verb Agreement');
  });

  test('a mistake can actually be practised, not just read', async ({ page }) => {
    await page.goto('/mistakes/pat_sva');

    await expect(page.getByRole('heading', { name: 'The rule' })).toBeVisible({ timeout: 20_000 });
    const drill = page.getByRole('region', { name: 'Fix it yourself' });
    await expect(drill).toBeVisible();

    // Get the first item right and confirm the drill teaches on the answer
    await page.getByLabel('Write the correction').fill('technology makes');
    await drill.getByRole('button', { name: 'Check' }).click();
    await expect(page.getByRole('status')).toContainText('Correct');

    // Scoped to the drill: "Next" also matches the Next.js dev-tools button.
    await drill.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByLabel('Write the correction')).toHaveValue('');
  });

  test('a wrong drill answer shows the correction and the rule', async ({ page }) => {
    await page.goto('/mistakes/pat_articles');

    await expect(page.getByRole('heading', { name: 'Fix it yourself' })).toBeVisible({
      timeout: 20_000,
    });
    await page.getByLabel('Write the correction').fill('definitely not it');
    await page.getByRole('button', { name: 'Check' }).click();

    await expect(page.getByRole('status')).toContainText('Not quite');
  });

  test('the writing editor counts words and blocks an empty submission', async ({ page }) => {
    await page.goto('/writing');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Writing');

    await page.getByRole('button', { name: 'Start writing' }).first().click();
    await expect(page.getByLabel('Your essay')).toBeVisible({ timeout: 20_000 });

    // An empty draft cannot be sent for analysis
    await expect(page.getByRole('button', { name: 'Submit for analysis' })).toBeDisabled();

    await page.getByLabel('Your essay').fill('One two three four five six.');
    await expect(page.getByText('6')).toBeVisible();
  });
});

test.describe('mock mode is exam-faithful (§19)', () => {
  test('mock mode offers no annotation and no flag hint', async ({ page }) => {
    await page.goto('/mock');
    await page.getByRole('link', { name: 'Start mock' }).first().click();

    await expect(page.getByText('Mock mode')).toBeVisible({ timeout: 20_000 });
    // Annotation is a practice affordance only.
    await expect(page.getByText(/Select any text to highlight/)).toBeHidden();
    await expect(page.getByRole('button', { name: 'Flag', exact: true })).toBeHidden();
  });

  test('practice mode does offer annotation', async ({ page }) => {
    await page.goto('/practice/session/test_practice_trees');

    await expect(page.getByText('Practice mode')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Select any text to highlight/)).toBeVisible();
  });
});
