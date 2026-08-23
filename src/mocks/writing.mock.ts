import type { WritingFeedback, WritingSubmission, WritingTask } from '@/types/writing';

export const MOCK_TASKS: WritingTask[] = [
  {
    id: 'task_tech_complexity',
    task: 2,
    kind: 'discussion',
    label: 'Task 2 · Opinion essay',
    prompt:
      'Some people believe that technology has made our lives too complex, while others argue it has simplified daily life.',
    instruction: 'Discuss both views and give your own opinion.',
    minWords: 250,
    recommendedMinutes: 40,
  },
  {
    id: 'task_remote_work',
    task: 2,
    kind: 'advantages_disadvantages',
    label: 'Task 2 · Advantages and disadvantages',
    prompt:
      'An increasing number of people now work from home rather than travelling to an office.',
    instruction: 'What are the advantages and disadvantages of this development?',
    minWords: 250,
    recommendedMinutes: 40,
  },
  {
    id: 'task_city_transport',
    task: 2,
    kind: 'problem_solution',
    label: 'Task 2 · Problem and solution',
    prompt: 'Traffic congestion is becoming a serious problem in many large cities.',
    instruction: 'What are the causes of this problem, and what measures could be taken to solve it?',
    minWords: 250,
    recommendedMinutes: 40,
  },
  {
    id: 'task_energy_chart',
    task: 1,
    kind: 'chart_description',
    label: 'Task 1 · Chart description',
    prompt:
      'The chart below shows the proportion of electricity generated from renewable sources in four countries between 2000 and 2024.',
    instruction: 'Summarise the information by selecting and reporting the main features.',
    minWords: 150,
    recommendedMinutes: 20,
  },
];

/** The draft shown mid-composition in the design canvas. */
const DRAFT_2_BODY = [
  'In the modern era, technology occupies a central place in almost every aspect of daily life. While some people argue that this development has made life unnecessarily complicated, others believe it has brought remarkable convenience. This essay will discuss both perspectives before presenting my own view.',
  'On the one hand, those who see technology as a source of complexity point to the constant demands it places on our attention. Notifications, updates and the pressure to remain connected can create stress rather than reduce it. Furthermore, older generations often struggle to keep pace with rapid change, which can leave them excluded from essential services.',
  'On the other hand, supporters argue that technology have simplified many routine tasks. Online banking, navigation and instant communication save a lot of time. People thinks technology are useful because it removes many small daily frictions. In addition, moreover, technology also helps people work from anywhere.',
].join('\n\n');

export const MOCK_SUBMISSIONS: WritingSubmission[] = [
  {
    id: 'sub_task2_d2',
    taskId: 'task_tech_complexity',
    draftNumber: 2,
    body: DRAFT_2_BODY,
    wordCount: 186,
    status: 'analyzed',
    createdAt: '2026-08-23T08:05:00.000Z',
    updatedAt: '2026-08-23T08:52:00.000Z',
    submittedAt: '2026-08-23T08:52:00.000Z',
    timeSpentSeconds: 826,
  },
  {
    id: 'sub_task2_d1',
    taskId: 'task_tech_complexity',
    draftNumber: 1,
    body:
      'Technology is everywhere in the modern society. Some people say it make life hard and some people say it make life easy. I will discuss both side.\n\nFirstly, technology give us many tools. We can do a research online, we can talk to friends, we can buy things. This is very useful and save a lot of time.\n\nSecondly, there is many problems. People spend too much time on phone. Also the goverment should build a infrastructure for internet in rural area.',
    wordCount: 92,
    status: 'analyzed',
    createdAt: '2026-08-16T13:20:00.000Z',
    updatedAt: '2026-08-16T14:02:00.000Z',
    submittedAt: '2026-08-16T14:02:00.000Z',
    timeSpentSeconds: 1_140,
  },
  {
    id: 'sub_remote_d1',
    taskId: 'task_remote_work',
    draftNumber: 1,
    body: '',
    wordCount: 0,
    status: 'draft',
    createdAt: '2026-08-22T19:00:00.000Z',
    updatedAt: '2026-08-22T19:00:00.000Z',
    submittedAt: null,
    timeSpentSeconds: 0,
  },
];

/** Offsets are computed against DRAFT_2_BODY so highlights land exactly. */
function offsetsOf(needle: string): { start: number; end: number } {
  const start = DRAFT_2_BODY.indexOf(needle);
  return { start, end: start + needle.length };
}

export const MOCK_FEEDBACK: WritingFeedback = {
  submissionId: 'sub_task2_d2',
  overallBand: 6,
  headline: 'Biggest problem: Coherence & Cohesion.',
  analysisSeconds: 14,
  analyzedAt: '2026-08-23T08:52:14.000Z',
  taskResponse: {
    criterion: 'task_response',
    label: 'Task Response',
    band: 6.5,
    comment:
      'Both views are addressed and your own position is signalled in the introduction, which is what lifts this above Band 6.',
    strengths: [
      'Both sides of the discussion are covered',
      'The introduction states a clear intention to give an opinion',
    ],
    improvements: [
      'Your own opinion is promised but never actually stated — add a sentence that commits to a position',
      'Body paragraph 2 lists four benefits instead of developing one or two',
    ],
  },
  coherence: {
    criterion: 'coherence',
    label: 'Coherence & Cohesion',
    band: 5.5,
    comment:
      'Your ideas are relevant, but paragraph progression is inconsistent — body paragraph 2 introduces three ideas without developing any of them.',
    strengths: ['Paragraphs are visually separated and roughly balanced'],
    improvements: [
      'Open each body paragraph with a topic sentence before any example',
      'Remove stacked linkers such as "In addition, moreover"',
      'Let each paragraph carry one controlling idea to its conclusion',
    ],
  },
  lexicalResource: {
    criterion: 'lexical_resource',
    label: 'Lexical Resource',
    band: 6,
    comment:
      'Vocabulary is adequate and mostly accurate, but the register slips into conversational phrasing at key moments.',
    strengths: ['Some precise choices: "remarkable convenience", "excluded from essential services"'],
    improvements: [
      'Replace "a lot of" with an academic quantifier such as "considerable"',
      'Use established collocations: "conduct research", not "do a research"',
    ],
  },
  grammar: {
    criterion: 'grammar',
    label: 'Grammatical Range & Accuracy',
    band: 6,
    comment:
      'Sentence structures are varied, but repeated subject–verb agreement errors keep this below Band 6.5.',
    strengths: ['Good use of complex sentences with relative clauses'],
    improvements: [
      'Check every subject for number before choosing the verb form',
      'Uncountable nouns like "technology" and "information" take singular verbs',
    ],
  },
  issues: [
    {
      id: 'iss_1',
      category: 'grammar',
      title: 'Subject–verb agreement',
      excerpt: 'have simplified',
      ...offsetsOf('have simplified'),
      why: '"Technology" is an uncountable singular noun, so it takes "has".',
      original: 'technology have simplified many routine tasks',
      suggestion: 'technology has simplified many routine tasks',
      occurrenceCount: 17,
      mistakePatternId: 'pat_sva',
    },
    {
      id: 'iss_2',
      category: 'vocabulary',
      title: 'Informal quantifier',
      excerpt: 'a lot of',
      ...offsetsOf('a lot of'),
      why: '"A lot of" is conversational. Academic writing prefers a precise or formal quantifier.',
      original: 'save a lot of time',
      suggestion: 'save considerable time',
      occurrenceCount: 8,
      mistakePatternId: 'pat_informal',
    },
    {
      id: 'iss_3',
      category: 'grammar',
      title: 'Subject–verb agreement',
      excerpt: 'People thinks technology are useful',
      ...offsetsOf('People thinks technology are useful'),
      why: '"People" is plural, so it takes "think". "Technology" is singular, so it takes "is".',
      original: 'People thinks technology are useful.',
      suggestion: 'People think technology is useful.',
      occurrenceCount: 17,
      mistakePatternId: 'pat_sva',
    },
    {
      id: 'iss_4',
      category: 'coherence',
      title: 'Stacked linkers',
      excerpt: 'In addition, moreover, technology also helps',
      ...offsetsOf('In addition, moreover, technology also helps'),
      why: '"In addition" and "moreover" signal the same relationship. Using both, plus "also", triples one connector.',
      original: 'In addition, moreover, technology also helps people work from anywhere.',
      suggestion: 'Technology also allows people to work from anywhere.',
      occurrenceCount: 6,
      mistakePatternId: 'pat_linkers',
    },
    // The two paragraph-level issues annotate only the phrase that carries the
    // fault, so they sit alongside the word-level fixes rather than covering
    // them. Real annotation behaves the same way: you underline the opener that
    // fails to state a topic, not the whole sentence.
    {
      id: 'iss_5',
      category: 'coherence',
      title: 'Paragraph has no topic sentence',
      excerpt: 'On the other hand, supporters argue that',
      ...offsetsOf('On the other hand, supporters argue that'),
      why: 'The paragraph opens with a linker and a claim about what other people think, not with the idea the paragraph will develop. The reader cannot tell what this paragraph is about until the third sentence.',
      original: 'On the other hand, supporters argue that technology has simplified many routine tasks.',
      suggestion:
        'The strongest argument for technology is that it has removed friction from routine tasks.',
      occurrenceCount: 12,
      mistakePatternId: 'pat_topic_sentence',
    },
    {
      id: 'iss_6',
      category: 'task_response',
      title: 'Ideas listed rather than developed',
      excerpt: 'Online banking, navigation and instant communication',
      ...offsetsOf('Online banking, navigation and instant communication'),
      why: 'Three examples are named and none is explained. Band 7 requires extension: pick one and say how and why it saves time.',
      original: 'Online banking, navigation and instant communication save a lot of time.',
      suggestion:
        'Online banking alone has removed the need for the weekly branch visit that once consumed an hour of every household’s week.',
      occurrenceCount: 9,
      mistakePatternId: 'pat_underdeveloped',
    },
  ],
  ladders: [
    {
      issueId: 'iss_3',
      original: {
        text: 'People think technology make our life easier.',
        band: 5.5,
        note: 'grammar error, informal phrasing',
      },
      corrected: {
        text: 'People think technology makes our life easier.',
        band: 6,
        note: 'error fixed, phrasing unchanged',
      },
      elevated: {
        text: 'Technology has made many aspects of modern life significantly more convenient.',
        band: 7.5,
        note: 'precise scope ("many aspects"), academic register, present perfect',
      },
    },
    {
      issueId: 'iss_5',
      original: {
        text: 'On the other hand, supporters argue that technology have simplified many routine tasks.',
        band: 5.5,
        note: 'opens with a linker, no controlling idea',
      },
      corrected: {
        text: 'On the other hand, supporters argue that technology has simplified many routine tasks.',
        band: 6,
        note: 'grammar fixed, still no topic sentence',
      },
      elevated: {
        text: 'The strongest argument in technology’s favour is that it has removed friction from tasks that once demanded hours of unpaid effort.',
        band: 7.5,
        note: 'states the paragraph’s claim first, then narrows it',
      },
    },
  ],
};
