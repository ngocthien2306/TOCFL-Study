export const GUIDED_LEVELS = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'C1'] as const;

export type GuidedLevel = typeof GUIDED_LEVELS[number];

export interface GuidedReadingSegment {
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

export interface GuidedReadingVocab {
  hanzi: string;
  pinyin: string;
  meaning: string;
  pos: string;
  level: string;
}

export interface GuidedReadingArticle {
  id: string;
  title: string;
  level: GuidedLevel;
  topic: string;
  segments: GuidedReadingSegment[];
  vocabulary: GuidedReadingVocab[];
  createdAt: string;
  model: string;
}

export interface GuidedReadingProgress {
  positionChars: number;
  completed: boolean;
  lastReadAt: string;
}

export type GuidedProgressMap = Record<string, GuidedReadingProgress>;

