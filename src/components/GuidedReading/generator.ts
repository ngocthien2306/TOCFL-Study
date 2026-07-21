import type { Word } from '../../types';
import {
  GUIDED_LEVELS,
  type GuidedLevel,
  type GuidedReadingArticle,
  type GuidedReadingSegment,
  type GuidedReadingVocab,
} from './types';

const API_URL = 'https://api.openai.com/v1/chat/completions';

const LEVEL_COUNTS: Record<GuidedLevel, number> = {
  A1: 3,
  A2: 3,
  A3: 3,
  A4: 3,
  B1: 3,
  B2: 3,
  C1: 2,
};

const LEVEL_LENGTHS: Record<GuidedLevel, string> = {
  A1: '80-120',
  A2: '110-160',
  A3: '140-200',
  A4: '170-240',
  B1: '210-290',
  B2: '260-360',
  C1: '320-450',
};

const FALLBACK_TOPICS = [
  '生活在臺灣', '學習與工作', '飲食與健康', '交通與旅行', '家人與朋友',
  '購物與服務', '科技與生活', '文化與節日', '環境與社會', '時間管理',
];

export interface GuidedGenerationTask {
  level: GuidedLevel;
  ordinal: number;
  topic: string;
  targets: Word[];
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function wordVariants(hanzi: string): string[] {
  return hanzi
    .split(/[/、]/)
    .map(item => item.replace(/[（(].*?[）)]/g, '').trim())
    .filter(Boolean);
}

function appearsIn(text: string, word: Word): boolean {
  return wordVariants(word.hanzi).some(variant => text.includes(variant));
}

function pickTargets(
  vocabulary: Word[],
  level: GuidedLevel,
  used: Set<string>,
  ordinal: number,
): { topic: string; targets: Word[] } {
  const levelIndex = GUIDED_LEVELS.indexOf(level);
  const eligible = vocabulary.filter(word => {
    const idx = GUIDED_LEVELS.indexOf(word.level as GuidedLevel);
    return idx >= 0 && idx <= levelIndex && word.meaning.trim();
  });
  const exact = eligible.filter(word => word.level === level);

  const contextGroups = new Map<string, Word[]>();
  exact.forEach(word => {
    const context = word.context?.trim();
    if (!context) return;
    const group = contextGroups.get(context) ?? [];
    group.push(word);
    contextGroups.set(context, group);
  });

  const contexts = shuffle(
    [...contextGroups.entries()].filter(([, words]) => words.length >= 5),
  );
  const selectedContext = contexts[ordinal % Math.max(contexts.length, 1)];
  const topic = selectedContext?.[0] ?? FALLBACK_TOPICS[(levelIndex * 3 + ordinal) % FALLBACK_TOPICS.length];
  const targetCount = levelIndex <= 1 ? 12 : levelIndex <= 3 ? 15 : 18;
  const selected: Word[] = [];

  const addFrom = (pool: Word[]) => {
    for (const word of shuffle(pool)) {
      if (selected.length >= targetCount) break;
      if (selected.some(item => item.hanzi === word.hanzi)) continue;
      selected.push(word);
      used.add(word.hanzi);
    }
  };

  if (selectedContext) addFrom(selectedContext[1].filter(word => !used.has(word.hanzi)));
  addFrom(exact.filter(word => !used.has(word.hanzi)));
  addFrom(eligible.filter(word => !used.has(word.hanzi)));
  if (selected.length < targetCount) addFrom(exact);
  if (selected.length < targetCount) addFrom(eligible);

  return { topic, targets: selected };
}

export function buildGuidedGenerationTasks(
  vocabulary: Word[],
  existing: GuidedReadingArticle[],
): GuidedGenerationTask[] {
  const tasks: GuidedGenerationTask[] = [];
  const used = new Set(existing.flatMap(article => article.vocabulary.map(word => word.hanzi)));

  for (const level of GUIDED_LEVELS) {
    const existingCount = existing.filter(article => article.level === level).length;
    for (let ordinal = existingCount; ordinal < LEVEL_COUNTS[level]; ordinal++) {
      const selection = pickTargets(vocabulary, level, used, ordinal);
      tasks.push({ level, ordinal, ...selection });
    }
  }
  return tasks;
}

export function buildGuidedExtraGenerationTask(
  vocabulary: Word[],
  existing: GuidedReadingArticle[],
  level: GuidedLevel,
): GuidedGenerationTask {
  const used = new Set(existing.flatMap(article => article.vocabulary.map(word => word.hanzi)));
  const ordinal = existing.filter(article => article.level === level).length;
  const selection = pickTargets(vocabulary, level, used, ordinal);
  return { level, ordinal, ...selection };
}

function generationPrompt(task: GuidedGenerationTask): string {
  const vocabulary = task.targets
    .map(word => `- ${word.hanzi} | ${word.pinyin} | ${word.meaning} | ${word.pos}`)
    .join('\n');

  return `Hãy tạo một bài luyện đọc tiếng Trung phồn thể cấp ${task.level}.

Chủ đề: ${task.topic}
Độ dài: ${LEVEL_LENGTHS[task.level]} chữ Hán.

KHO TỪ VỰNG MỤC TIÊU CỦA BÀI:
${vocabulary}

Yêu cầu bắt buộc:
- Chỉ dùng chữ Trung Phồn Thể theo cách dùng tại Đài Loan, tuyệt đối không dùng chữ Giản Thể.
- Dùng tự nhiên ít nhất một nửa số từ mục tiêu trên. Có thể dùng hư từ và từ phổ thông cấp thấp hơn để câu tự nhiên.
- Chia bài thành 6-12 câu, theo đúng thứ tự đọc.
- Pinyin phải có dấu thanh, khớp từng câu tiếng Trung.
- Bản dịch tiếng Việt phải tự nhiên và khớp từng câu.
- Không tạo câu hỏi trắc nghiệm, không tạo phần nhận xét, không thêm markdown.

Trả về đúng một JSON object theo cấu trúc:
{
  "title": "Tiêu đề ngắn bằng tiếng Trung phồn thể",
  "topic": "Chủ đề ngắn bằng tiếng Việt",
  "segments": [
    {
      "chinese": "Một câu tiếng Trung phồn thể。",
      "pinyin": "Pinyin có dấu thanh.",
      "vietnamese": "Bản dịch tiếng Việt."
    }
  ]
}`;
}

function extractJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI không trả về JSON hợp lệ.');
    return JSON.parse(match[0]);
  }
}

function normalizeSegments(value: unknown): GuidedReadingSegment[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => {
      const row = item as Partial<GuidedReadingSegment>;
      return {
        chinese: String(row.chinese ?? '').trim(),
        pinyin: String(row.pinyin ?? '').trim(),
        vietnamese: String(row.vietnamese ?? '').trim(),
      };
    })
    .filter(row => row.chinese && row.pinyin && row.vietnamese);
}

function createId(level: GuidedLevel): string {
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `guided-${level}-${suffix}`;
}

export async function generateGuidedArticle(
  apiKey: string,
  model: string,
  task: GuidedGenerationTask,
  signal?: AbortSignal,
): Promise<GuidedReadingArticle> {
  const response = await fetch(API_URL, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'Bạn là giáo viên TOCFL tại Đài Loan. Luôn viết chữ Trung Phồn Thể và trả về JSON chính xác.',
        },
        { role: 'user', content: generationPrompt(task) },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 6000,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(payload.error?.message ?? `OpenAI HTTP ${response.status}`);
  }

  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const raw = payload.choices?.[0]?.message?.content;
  if (!raw) throw new Error('AI không trả về nội dung bài đọc.');

  const parsed = extractJson(raw) as { title?: unknown; topic?: unknown; segments?: unknown };
  const segments = normalizeSegments(parsed.segments);
  if (segments.length < 4) throw new Error('Bài đọc có quá ít câu hoặc thiếu Pinyin/bản dịch.');

  const fullText = segments.map(segment => segment.chinese).join('');
  const usedWords: GuidedReadingVocab[] = task.targets
    .filter(word => appearsIn(fullText, word))
    .map(word => ({
      hanzi: word.hanzi,
      pinyin: word.pinyin,
      meaning: word.meaning,
      pos: word.pos,
      level: word.level,
    }));

  const minimumUsed = Math.min(6, Math.ceil(task.targets.length * 0.4));
  if (usedWords.length < minimumUsed) {
    throw new Error(`AI chỉ dùng ${usedWords.length}/${task.targets.length} từ mục tiêu.`);
  }

  return {
    id: createId(task.level),
    title: String(parsed.title ?? '').trim() || `${task.level} 閱讀練習`,
    level: task.level,
    topic: String(parsed.topic ?? '').trim() || task.topic,
    segments,
    vocabulary: usedWords,
    createdAt: new Date().toISOString(),
    model,
  };
}

export function getExpectedArticleCount(): number {
  return Object.values(LEVEL_COUNTS).reduce((sum, count) => sum + count, 0);
}
