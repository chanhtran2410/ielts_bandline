import type { Passage } from '@/types/question';

/** The featured passage from the design canvas, verbatim. */
export const URBAN_TREES: Passage = {
  id: 'passage_urban_trees',
  order: 2,
  title: 'The Hidden Life of Urban Trees',
  wordCount: 341,
  paragraphs: [
    {
      letter: 'A',
      text: 'City trees have long been regarded as little more than decoration, softening the hard edges of concrete and glass. Yet a growing body of research suggests that urban forests perform work of remarkable economic and ecological value. A single mature street tree can intercept thousands of litres of stormwater each year, reducing the burden on drainage systems that were often designed for smaller populations.',
    },
    {
      letter: 'B',
      text: 'The cooling effect of trees is perhaps their most measurable contribution. Researchers in Melbourne found that streets with dense canopy cover were up to four degrees cooler in summer than exposed streets nearby, a difference that translates directly into lower energy consumption and fewer heat-related hospital admissions.',
    },
    {
      letter: 'C',
      text: 'Despite these benefits, urban trees face conditions that would challenge any organism. Compacted soil restricts root growth, road salt alters soil chemistry, and construction work severs root networks that took decades to establish. The average life expectancy of a downtown street tree is estimated at only thirteen years, compared with several centuries for the same species in a forest.',
    },
    {
      letter: 'D',
      text: "Some cities are responding with radical changes to planting practice. Structural soils, which combine load-bearing stone with soil that roots can penetrate, allow trees to thrive beneath pavements. Stockholm's redesigned streetscapes have doubled canopy growth rates, and the approach is now being copied across northern Europe.",
    },
    {
      letter: 'E',
      text: 'The question facing planners is no longer whether trees are worth the investment, but how to value them accurately. Traditional accounting treats a tree as a maintenance cost; ecological accounting treats it as infrastructure that appreciates over time. Which framework prevails may determine what the cities of the next century look like.',
    },
  ],
};

export const SLEEP_RESEARCH: Passage = {
  id: 'passage_sleep',
  order: 1,
  title: 'Rethinking the Eight-Hour Night',
  wordCount: 298,
  paragraphs: [
    {
      letter: 'A',
      text: 'The belief that adults require an unbroken eight hours of sleep is surprisingly recent. Historical records from pre-industrial Europe describe a segmented pattern: a first sleep beginning shortly after dusk, a waking interval of an hour or two, and a second sleep until dawn. Diaries, court documents and medical texts all refer to this interval as an ordinary part of the night.',
    },
    {
      letter: 'B',
      text: 'Artificial lighting appears to have compressed this pattern. As lamps and later electric light pushed bedtimes later, the waking interval was squeezed out, and continuous sleep became the cultural norm against which everything else is measured. Sleep researchers now suspect that many people who describe themselves as insomniacs are in fact experiencing a natural segmented rhythm.',
    },
    {
      letter: 'C',
      text: 'Laboratory work supports this. When volunteers were placed in short winter-like days with fourteen hours of darkness, their sleep settled within weeks into two distinct blocks separated by a calm, alert interval. Participants did not report distress during the waking period; several described it as the most peaceful hour of the day.',
    },
    {
      letter: 'D',
      text: 'The practical implication is not that everyone should adopt segmented sleep, but that the eight-hour standard is a convention rather than a biological constant. Clinicians increasingly advise patients who wake in the night to treat the interval as unremarkable, since the anxiety about being awake often does more damage than the waking itself.',
    },
  ],
};

export const LANGUAGE_LOSS: Passage = {
  id: 'passage_language',
  order: 3,
  title: 'Counting the Last Speakers',
  wordCount: 276,
  paragraphs: [
    {
      letter: 'A',
      text: 'Of the roughly seven thousand languages spoken today, linguists estimate that nearly half will have no fluent speakers by the end of the century. The rate of loss is not evenly distributed: it concentrates in regions of high linguistic density, where dozens of small languages sit alongside one dominant national language.',
    },
    {
      letter: 'B',
      text: 'Documentation projects race to record what remains. A thorough grammar and dictionary of a single language can take a decade of fieldwork, and the resulting archive preserves structure without preserving use. Critics argue that recordings create museums rather than communities.',
    },
    {
      letter: 'C',
      text: 'Revitalisation offers a different model. In Aotearoa New Zealand, immersion preschools raised a generation of young Maori speakers from a base that had seemed irrecoverable. The programme succeeded because it created domains in which the language was necessary rather than merely respected.',
    },
    {
      letter: 'D',
      text: 'What such cases suggest is that language survival depends less on the number of speakers than on the number of situations in which a language is the obvious choice. A language with ten thousand speakers and no schools is more fragile than one with two thousand speakers and a functioning school system.',
    },
  ],
};

export const ALL_PASSAGES: readonly Passage[] = [SLEEP_RESEARCH, URBAN_TREES, LANGUAGE_LOSS];
