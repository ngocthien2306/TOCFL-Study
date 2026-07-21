import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HighlightRecord } from '../../api/client';
import { guidedReadingsApi, guidedTtsApi } from '../../api/client';
import type { Word } from '../../types';
import { useApiKey } from '../../contexts/ApiKeyContext';
import { useHighlights } from '../../contexts/HighlightsContext';
import { useSonioxKey } from '../../contexts/SonioxKeyContext';
import { useAIModel } from '../../hooks/useAIModel';
import { useLang } from '../../i18n/LangContext';
import type { Lang } from '../../i18n/translations';
import { SonioxReadCoach } from './SonioxReadCoach';
import { loadTtsAudio, saveTtsAudio } from './ttsAudioStorage';
import { HighlightableText } from '../HighlightableText';
import {
  buildGuidedExtraGenerationTask,
  buildGuidedGenerationTasks,
  generateGuidedArticle,
  getExpectedArticleCount,
} from './generator';
import {
  clearUnassignedGuidedArticles,
  isCustomGuidedArticle,
  loadGuidedArticles,
  loadGuidedProgress,
  loadUnassignedGuidedArticles,
  mergeGuidedArticles,
  saveGuidedArticles,
  saveGuidedProgress,
} from './storage';
import {
  GUIDED_LEVELS,
  type GuidedLevel,
  type GuidedProgressMap,
  type GuidedReadingArticle,
  type GuidedReadingProgress,
} from './types';
import './guidedReading.css';

interface Props {
  vocabulary: Word[];
  token?: string | null;
  userId?: number | null;
}

interface GenerationState {
  running: boolean;
  done: number;
  total: number;
  currentLevel?: GuidedLevel;
  errors: string[];
}

const EXPECTED_COUNT = getExpectedArticleCount();

interface GuidedCopy {
  eyebrow: string;
  title: string;
  subtitle: (count: string) => string;
  generated: string;
  completed: string;
  remaining: string;
  createSet: (count: number) => string;
  setReady: string;
  modelLabel: string;
  modelNote: string;
  stop: string;
  createMissing: (count: number) => string;
  create: (count: number) => string;
  enough: (count: number) => string;
  apiKeyNotice: string;
  generating: (level: string) => string;
  generationFinished: string;
  failed: (count: number) => string;
  articleFailure: (level: string, ordinal: number, message: string) => string;
  library: string;
  libraryHint: string;
  all: string;
  empty: (level?: string) => string;
  emptyHint: string;
  read: string;
  chars: string;
  sentences: string;
  words: string;
  back: string;
  translation: string;
  readingProgress: string;
  previousSentence: string;
  nextSentence: string;
  pause: string;
  reread: string;
  start: string;
  speed: string;
  charsPerMinute: (count: number) => string;
  fontSize: string;
  articleVocabulary: string;
  unknownVocabulary: string;
  unknownHint: string;
  removeWord: (word: string) => string;
  missingMeaning: string;
  starterNote: string;
  createMore: string;
  extraKeyNotice: string;
  chooseLevel: string;
  listenSentence: (number: number) => string;
  listenAll: string;
  stopVoice: string;
  voice: string;
  femaleVoice: string;
  maleVoice: string;
  voiceSpeed: string;
  ttsKeyRequired: string;
  ttsGenerating: string;
  ttsFailure: string;
}

const GUIDED_COPY: Record<Lang, GuidedCopy> = {
  vi: {
    eyebrow: 'LUYỆN ĐỌC · TELEPROMPTER', title: 'Đọc theo tiếng Trung',
    subtitle: count => `Bài đọc được tạo từ kho ${count} từ vựng của bạn, chia theo cấp A1–C1.`,
    generated: 'Bài đã tạo', completed: 'Đã hoàn thành', remaining: 'Còn thiếu',
    createSet: count => `Tạo bộ ${count} bài đọc`, setReady: 'Bộ bài đọc đã sẵn sàng', modelLabel: 'Mô hình',
    modelNote: 'Mỗi bài được lưu ngay sau khi tạo xong; có thể đóng và tiếp tục phần còn thiếu sau.',
    stop: 'Dừng tạo', createMissing: count => `Tạo ${count} bài còn thiếu`, create: count => `Tạo ${count} bài`,
    enough: count => `✓ Đã đủ ${count} bài`, apiKeyNotice: 'Hãy nhập OpenAI API Key ở góc trên bên phải trước khi tạo bài.',
    generating: level => `Đang tạo cấp ${level}…`, generationFinished: 'Đợt tạo bài đã kết thúc',
    failed: count => `${count} bài chưa tạo được — có thể thử lại`,
    articleFailure: (level, ordinal, message) => `${level} bài ${ordinal}: ${message}`,
    library: 'Thư viện bài đọc', libraryHint: 'Chọn bài để mở chế độ tự cuộn.', all: 'Tất cả',
    empty: level => `Chưa có bài đọc${level ? ` cấp ${level}` : ''}`,
    emptyHint: 'Nhập API key và tạo bộ bài đầu tiên để bắt đầu luyện đọc.', read: '✓ Đã đọc',
    chars: 'chữ', sentences: 'câu', words: 'từ', back: 'Quay lại', translation: 'Tiếng Việt',
    readingProgress: 'Tiến độ bài đọc', previousSentence: 'Câu trước', nextSentence: 'Câu sau',
    pause: 'Ⅱ Tạm dừng', reread: '↻ Đọc lại', start: '▶ Bắt đầu', speed: 'Tốc độ',
    charsPerMinute: count => `${count} chữ/phút`, fontSize: 'Cỡ chữ',
    articleVocabulary: 'Từ vựng của bài', unknownVocabulary: 'Từ tôi chưa biết',
    unknownHint: 'Bôi đen một từ trong bài và chọn Đánh dấu để thêm vào đây.',
    removeWord: word => `Xoá ${word}`, missingMeaning: 'Chưa có nghĩa trong kho từ vựng',
    starterNote: '20 bài mẫu đã có sẵn. Khi muốn luyện thêm, chọn cấp độ và tạo từng bài mới bằng AI.',
    createMore: 'Tạo thêm 1 bài', extraKeyNotice: '20 bài mẫu đã sẵn sàng. Nhập OpenAI API Key khi bạn muốn tạo thêm bài mới.',
    chooseLevel: 'Cấp độ bài mới',
    listenSentence: number => `Soniox đọc câu ${number}`, listenAll: 'Soniox đọc toàn bài', stopVoice: 'Dừng giọng đọc',
    voice: 'Giọng đọc', femaleVoice: 'Nữ', maleVoice: 'Nam',
    voiceSpeed: 'Tốc độ giọng', ttsKeyRequired: 'Nhập Soniox API Key ở khung bên phải để nghe giọng mẫu.',
    ttsGenerating: 'Soniox đang tạo giọng đọc…', ttsFailure: 'Soniox chưa thể tạo giọng đọc. Hãy kiểm tra API key và thử lại.',
  },
  zh: {
    eyebrow: '跟讀練習 · 提詞模式', title: '中文跟讀',
    subtitle: count => `文章根據您的 ${count} 個詞彙生成，並依 A1–C1 分級。`,
    generated: '已建立文章', completed: '已完成', remaining: '尚缺',
    createSet: count => `建立 ${count} 篇閱讀文章`, setReady: '閱讀文章已準備完成', modelLabel: '模型',
    modelNote: '每篇文章建立後會立即儲存；您可以關閉頁面，之後再繼續。',
    stop: '停止建立', createMissing: count => `建立尚缺的 ${count} 篇`, create: count => `建立 ${count} 篇`,
    enough: count => `✓ 已有 ${count} 篇`, apiKeyNotice: '建立文章前，請先在右上角輸入 OpenAI API 金鑰。',
    generating: level => `正在建立 ${level} 級文章…`, generationFinished: '本次建立已結束',
    failed: count => `${count} 篇未能建立，可再次嘗試`,
    articleFailure: (level, ordinal, message) => `${level} 第 ${ordinal} 篇：${message}`,
    library: '閱讀文章庫', libraryHint: '選擇文章以開啟自動捲動模式。', all: '全部',
    empty: level => level ? `尚無 ${level} 級文章` : '尚無閱讀文章',
    emptyHint: '輸入 API 金鑰並建立第一組文章，即可開始練習。', read: '✓ 已讀完',
    chars: '字', sentences: '句', words: '詞', back: '返回', translation: '越南語',
    readingProgress: '閱讀進度', previousSentence: '上一句', nextSentence: '下一句',
    pause: 'Ⅱ 暫停', reread: '↻ 重新閱讀', start: '▶ 開始', speed: '速度',
    charsPerMinute: count => `${count} 字/分鐘`, fontSize: '字體大小',
    articleVocabulary: '文章詞彙', unknownVocabulary: '我不熟悉的詞',
    unknownHint: '選取文章中的詞彙並按「標記」，即可加入此處。',
    removeWord: word => `刪除 ${word}`, missingMeaning: '詞彙庫中沒有釋義',
    starterNote: '已內建 20 篇範例文章。需要更多練習時，可選擇級別並使用 AI 逐篇建立。',
    createMore: '再建立 1 篇', extraKeyNotice: '20 篇範例文章已準備完成。需要新增文章時，請輸入 OpenAI API 金鑰。',
    chooseLevel: '新文章級別',
    listenSentence: number => `Soniox 播放第 ${number} 句`, listenAll: 'Soniox 播放全文', stopVoice: '停止播放',
    voice: '朗讀聲音', femaleVoice: '女聲', maleVoice: '男聲',
    voiceSpeed: '朗讀速度', ttsKeyRequired: '請先在右側輸入 Soniox API 金鑰，才能播放示範語音。',
    ttsGenerating: 'Soniox 正在產生語音…', ttsFailure: 'Soniox 無法產生語音，請檢查 API 金鑰後再試。',
  },
  en: {
    eyebrow: 'READ ALOUD · TELEPROMPTER', title: 'Chinese read-along',
    subtitle: count => `Passages are generated from your ${count}-word vocabulary library and graded from A1 to C1.`,
    generated: 'Created', completed: 'Completed', remaining: 'Remaining',
    createSet: count => `Create a set of ${count} passages`, setReady: 'Your reading set is ready', modelLabel: 'Model',
    modelNote: 'Each passage is saved as soon as it is created, so you can close this page and continue later.',
    stop: 'Stop', createMissing: count => `Create ${count} remaining`, create: count => `Create ${count} passages`,
    enough: count => `✓ All ${count} passages ready`, apiKeyNotice: 'Enter your OpenAI API key in the top-right corner before creating passages.',
    generating: level => `Creating a ${level} passage…`, generationFinished: 'Generation finished',
    failed: count => `${count} passages could not be created — try again`,
    articleFailure: (level, ordinal, message) => `${level} passage ${ordinal}: ${message}`,
    library: 'Reading library', libraryHint: 'Choose a passage to open auto-scroll mode.', all: 'All',
    empty: level => level ? `No ${level} passages yet` : 'No passages yet',
    emptyHint: 'Enter an API key and create your first reading set to begin.', read: '✓ Read',
    chars: 'chars', sentences: 'sentences', words: 'words', back: 'Back', translation: 'Vietnamese',
    readingProgress: 'Reading progress', previousSentence: 'Previous sentence', nextSentence: 'Next sentence',
    pause: 'Ⅱ Pause', reread: '↻ Read again', start: '▶ Start', speed: 'Speed',
    charsPerMinute: count => `${count} chars/min`, fontSize: 'Font size',
    articleVocabulary: 'Passage vocabulary', unknownVocabulary: 'Words I do not know',
    unknownHint: 'Select a word in the passage and choose Highlight to add it here.',
    removeWord: word => `Remove ${word}`, missingMeaning: 'No meaning found in your vocabulary library',
    starterNote: '20 starter passages are included. When you need more practice, choose a level and generate one new passage with AI.',
    createMore: 'Create 1 more', extraKeyNotice: 'Your 20 starter passages are ready. Add an OpenAI API key whenever you want to create more.',
    chooseLevel: 'New passage level',
    listenSentence: number => `Soniox: sentence ${number}`, listenAll: 'Soniox: full passage', stopVoice: 'Stop voice',
    voice: 'Voice', femaleVoice: 'Female', maleVoice: 'Male',
    voiceSpeed: 'Voice speed', ttsKeyRequired: 'Enter a Soniox API key in the panel on the right to hear the sample voice.',
    ttsGenerating: 'Soniox is generating the voice…', ttsFailure: 'Soniox could not generate audio. Check the API key and try again.',
  },
};

const NUMBER_LOCALES: Record<Lang, string> = { vi: 'vi-VN', zh: 'zh-TW', en: 'en-US' };
const TTS_VOICE_KEY = 'tocfl_soniox_tts_voice';

interface SonioxVoiceOption {
  id: string;
  gender?: 'female' | 'male' | 'neutral';
  description?: string;
}

const SONIOX_BUILTIN_VOICES: SonioxVoiceOption[] = [
  { id: 'Maya', gender: 'female', description: 'Steady, clear, warm' },
  { id: 'Daniel', gender: 'male', description: 'Rich, steady, mature' },
  { id: 'Elise', gender: 'female', description: 'Warm, polished, Australian accent' },
  { id: 'Arjun', gender: 'male', description: 'Deep, warm, Indian accent' },
  { id: 'Rohan', gender: 'male', description: 'Lively, expressive, Indian accent' },
  { id: 'Priya', gender: 'female', description: 'Clear, composed, Indian accent' },
  { id: 'Meera', gender: 'female', description: 'Polished, crisp, Indian accent' },
];

function loadSavedTtsVoice(): string {
  try {
    return localStorage.getItem(TTS_VOICE_KEY) || 'Maya';
  } catch {
    return 'Maya';
  }
}

function articleTextLength(article: GuidedReadingArticle): number {
  return article.segments.reduce((sum, segment) => sum + segment.chinese.length, 0);
}

function segmentIndexAt(article: GuidedReadingArticle, position: number): number {
  let end = 0;
  for (let index = 0; index < article.segments.length; index++) {
    end += article.segments[index].chinese.length;
    if (position < end) return index;
  }
  return Math.max(0, article.segments.length - 1);
}

function wordVariants(hanzi: string): string[] {
  return hanzi.split(/[/、]/).map(item => item.replace(/[（(].*?[）)]/g, '').trim()).filter(Boolean);
}

function findLocalWord(text: string, vocabulary: Word[]): Word | undefined {
  const normalized = text.trim();
  return vocabulary.find(word => wordVariants(word.hanzi).includes(normalized));
}

function dedupeHighlights(items: HighlightRecord[]): HighlightRecord[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = item.text.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

interface ReaderProps {
  article: GuidedReadingArticle;
  vocabulary: Word[];
  token?: string | null;
  savedProgress?: GuidedReadingProgress;
  onBack: () => void;
  onProgress: (articleId: string, progress: GuidedReadingProgress) => void;
}

const AudioGlyph: React.FC<{ stop?: boolean }> = ({ stop = false }) => (
  <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
    {stop ? (
      <rect x="5" y="5" width="10" height="10" rx="1.5" fill="currentColor" />
    ) : (
      <>
        <path d="M3.5 8h3l4-3.2v10.4L6.5 12h-3V8Z" fill="currentColor" />
        <path d="M13 7.2a4 4 0 0 1 0 5.6M15 5.3a6.6 6.6 0 0 1 0 9.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    )}
  </svg>
);

const GuidedReader: React.FC<ReaderProps> = ({
  article, vocabulary, token, savedProgress, onBack, onProgress,
}) => {
  const { lang } = useLang();
  const copy = GUIDED_COPY[lang];
  const { sonioxKey, hasSonioxKey } = useSonioxKey();
  const pageKey = `guided-reading:${article.id}`;
  const { getForPage, remove } = useHighlights();
  const unknownWords = useMemo(
    () => dedupeHighlights(getForPage(pageKey)),
    [getForPage, pageKey],
  );

  const totalChars = Math.max(1, articleTextLength(article));
  const initialPosition = Math.min(savedProgress?.positionChars ?? 0, totalChars);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(120);
  const [fontSize, setFontSize] = useState(30);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [positionChars, setPositionChars] = useState(initialPosition);
  const [activeIndex, setActiveIndex] = useState(() => segmentIndexAt(article, initialPosition));
  const [ttsRate, setTtsRate] = useState(0.85);
  const [ttsVoice, setTtsVoice] = useState(loadSavedTtsVoice);
  const [ttsVoices, setTtsVoices] = useState<SonioxVoiceOption[]>(SONIOX_BUILTIN_VOICES);
  const [ttsPlayback, setTtsPlayback] = useState<{ scope: 'segment' | 'article'; index: number } | null>(null);
  const [ttsLoading, setTtsLoading] = useState<{ scope: 'segment' | 'article'; index: number } | null>(null);
  const [ttsError, setTtsError] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const positionRef = useRef(initialPosition);
  const lastUiUpdateRef = useRef(0);
  const lastSaveRef = useRef(0);
  const ttsRunRef = useRef(0);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsUrlsRef = useRef<Map<string, string>>(new Map());
  const ttsPendingRef = useRef<Map<string, Promise<string>>>(new Map());
  const simplifyChineseRef = useRef<((text: string) => string) | null>(null);

  const segmentEnds = useMemo(() => {
    return article.segments.reduce<{ total: number; ends: number[] }>((state, segment) => {
      const total = state.total + segment.chinese.length;
      return { total, ends: [...state.ends, total] };
    }, { total: 0, ends: [] }).ends;
  }, [article.segments]);

  const persist = useCallback((completed = false) => {
    onProgress(article.id, {
      positionChars: completed ? totalChars : positionRef.current,
      completed: completed || savedProgress?.completed === true,
      lastReadAt: new Date().toISOString(),
    });
  }, [article.id, onProgress, savedProgress?.completed, totalChars]);

  const updateVisualPosition = useCallback((nextPosition: number) => {
    const container = scrollRef.current;
    if (container) {
      const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
      container.scrollTop = (nextPosition / totalChars) * maxScroll;
    }
    const nextIndex = segmentEnds.findIndex(end => nextPosition < end);
    setActiveIndex(nextIndex < 0 ? article.segments.length - 1 : nextIndex);
  }, [article.segments.length, segmentEnds, totalChars]);

  const setScrollContainer = useCallback((node: HTMLDivElement | null) => {
    scrollRef.current = node;
    if (!node) return;
    requestAnimationFrame(() => {
      const maxScroll = Math.max(0, node.scrollHeight - node.clientHeight);
      node.scrollTop = (initialPosition / totalChars) * maxScroll;
    });
  }, [initialPosition, totalChars]);

  useEffect(() => {
    if (!playing) {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      persist(false);
      return;
    }

    let lastTime = performance.now();
    const tick = (now: number) => {
      const deltaMinutes = Math.min(now - lastTime, 250) / 60000;
      lastTime = now;
      const next = Math.min(totalChars, positionRef.current + speed * deltaMinutes);
      positionRef.current = next;
      updateVisualPosition(next);

      if (now - lastUiUpdateRef.current > 180 || next >= totalChars) {
        lastUiUpdateRef.current = now;
        setPositionChars(next);
      }
      if (now - lastSaveRef.current > 2000) {
        lastSaveRef.current = now;
        persist(false);
      }
      if (next >= totalChars) {
        setPlaying(false);
        persist(true);
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [persist, playing, speed, totalChars, updateVisualPosition]);

  useEffect(() => () => persist(false), [persist]);

  useEffect(() => {
    if (!sonioxKey) return;
    const controller = new AbortController();
    void fetch('https://api.soniox.com/v1/tts-models', {
      headers: { Authorization: `Bearer ${sonioxKey}` },
      signal: controller.signal,
    })
      .then(async response => {
        if (!response.ok) throw new Error(`Soniox voices (${response.status})`);
        return response.json() as Promise<{
          models?: Array<{ id: string; voices?: SonioxVoiceOption[] }>;
        }>;
      })
      .then(data => {
        const liveVoices = data.models?.find(model => model.id === 'tts-rt-v1')?.voices;
        if (!liveVoices?.length) return;
        const savedVoice = loadSavedTtsVoice();
        setTtsVoices(liveVoices.some(voice => voice.id === savedVoice)
          ? liveVoices
          : [{ id: savedVoice }, ...liveVoices]);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [sonioxKey]);

  useEffect(() => () => {
    ttsRunRef.current += 1;
    ttsAudioRef.current?.pause();
    ttsUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    ttsUrlsRef.current.clear();
  }, []);

  const seek = (next: number) => {
    const bounded = Math.max(0, Math.min(totalChars, next));
    positionRef.current = bounded;
    setPositionChars(bounded);
    updateVisualPosition(bounded);
  };

  const stopTts = () => {
    ttsRunRef.current += 1;
    ttsAudioRef.current?.pause();
    ttsAudioRef.current = null;
    setTtsPlayback(null);
    setTtsLoading(null);
  };

  const getOrCreateTtsUrl = (index: number, scope: 'segment' | 'article'): Promise<string> => {
    const segment = article.segments[index];
    if (!segment) return Promise.reject(new Error('Missing reading segment.'));
    const sourceText = scope === 'article'
      ? article.segments.map(item => item.chinese).join('\n')
      : segment.chinese;
    const requestKey = `${scope}\u0000${ttsVoice}\u0000${sourceText}\u0000${ttsRate}`;
    const cachedUrl = ttsUrlsRef.current.get(requestKey);
    if (cachedUrl) return Promise.resolve(cachedUrl);
    const pending = ttsPendingRef.current.get(requestKey);
    if (pending) return pending;

    const request = (async () => {
      const { default: OpenCC } = await import('opencc-js/t2cn');
      const simplifyChinese = simplifyChineseRef.current
        ?? OpenCC.Converter({ from: 'tw', to: 'cn' });
      simplifyChineseRef.current = simplifyChinese;
      const simplifiedText = simplifyChinese(sourceText);
      const cacheKey = await sha256(`soniox\u0000tts-rt-v1\u0000${ttsVoice}\u0000zh\u0000mp3\u0000${ttsRate}\u0000${simplifiedText}`);

      let audioBlob = await loadTtsAudio(cacheKey).catch(() => null);
      if (!audioBlob && token) {
        audioBlob = await guidedTtsApi.get(token, cacheKey).catch(() => null);
        if (audioBlob) void saveTtsAudio(cacheKey, audioBlob).catch(() => undefined);
      }

      if (!audioBlob) {
        if (!sonioxKey) throw new Error(copy.ttsKeyRequired);
        const { SonioxClient } = await import('@soniox/client');
        const client = new SonioxClient({ config: { api_key: sonioxKey } });
        const bytes = await client.tts.generate({
          text: simplifiedText,
          model: 'tts-rt-v1',
          language: 'zh',
          voice: ttsVoice,
          audio_format: 'mp3',
          speed: ttsRate,
        });
        audioBlob = new Blob([Uint8Array.from(bytes).buffer], { type: 'audio/mpeg' });
        void saveTtsAudio(cacheKey, audioBlob).catch(() => undefined);
        if (token) void guidedTtsApi.put(token, cacheKey, audioBlob).catch(() => undefined);
      }

      const url = URL.createObjectURL(audioBlob);
      ttsUrlsRef.current.set(requestKey, url);
      return url;
    })().finally(() => {
      ttsPendingRef.current.delete(requestKey);
    });
    ttsPendingRef.current.set(requestKey, request);
    return request;
  };

  const playTts = async (startIndex: number, scope: 'segment' | 'article') => {
    if (!sonioxKey) {
      setTtsError(copy.ttsKeyRequired);
      return;
    }
    const matchingPlayback = ttsPlayback?.scope === scope && (scope === 'article' || ttsPlayback.index === startIndex);
    const matchingLoad = ttsLoading?.scope === scope && (scope === 'article' || ttsLoading.index === startIndex);
    if (matchingPlayback || matchingLoad) {
      stopTts();
      return;
    }

    setPlaying(false);
    setTtsError('');
    stopTts();
    const runId = ttsRunRef.current + 1;
    ttsRunRef.current = runId;

    const speakAt = async (index: number): Promise<void> => {
      if (ttsRunRef.current !== runId) return;
      const segment = article.segments[index];
      if (!segment) {
        setTtsPlayback(null);
        return;
      }

      try {
        setTtsLoading({ scope, index });
        const url = await getOrCreateTtsUrl(index, scope);
        if (ttsRunRef.current !== runId) return;

        const audio = new Audio(url);
        ttsAudioRef.current = audio;
        audio.onplay = () => {
          if (ttsRunRef.current !== runId) return;
          const segmentStart = index === 0 ? 0 : segmentEnds[index - 1];
          seek(segmentStart);
          setTtsLoading(null);
          setTtsPlayback({ scope, index });
        };
        if (scope === 'article') {
          audio.ontimeupdate = () => {
            if (ttsRunRef.current !== runId || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
            updateVisualPosition((audio.currentTime / audio.duration) * totalChars);
          };
        }
        audio.onended = () => {
          if (ttsRunRef.current !== runId) return;
          ttsAudioRef.current = null;
          if (scope === 'article') {
            seek(totalChars);
            persist(true);
          }
          setTtsPlayback(null);
        };
        audio.onerror = () => {
          if (ttsRunRef.current !== runId) return;
          setTtsLoading(null);
          setTtsPlayback(null);
          setTtsError(copy.ttsFailure);
        };
        await audio.play();
      } catch {
        if (ttsRunRef.current !== runId) return;
        setTtsLoading(null);
        setTtsPlayback(null);
        setTtsError(copy.ttsFailure);
      }
    };

    await speakAt(startIndex);
  };

  const moveSentence = (direction: -1 | 1) => {
    stopTts();
    const nextIndex = Math.max(0, Math.min(article.segments.length - 1, activeIndex + direction));
    const start = nextIndex === 0 ? 0 : segmentEnds[nextIndex - 1];
    seek(start);
  };

  const handlePointerUp = () => {
    if (window.getSelection()?.toString().trim()) setPlaying(false);
  };

  const percent = Math.round((positionChars / totalChars) * 100);

  return (
    <section className="guided-reader">
      <header className="guided-reader__header">
        <button className="guided-icon-btn" onClick={() => { persist(false); onBack(); }} aria-label={copy.back}>
          ←
        </button>
        <div className="guided-reader__title">
          <span className="guided-level-badge">{article.level}</span>
          <div>
            <h2>{article.title}</h2>
            <p>{article.topic} · {totalChars} {copy.chars} · {percent}%</p>
          </div>
        </div>
        <div className="guided-reader__toggles">
          <button className={showPinyin ? 'active' : ''} onClick={() => setShowPinyin(value => !value)}>Pinyin</button>
          <button className={showTranslation ? 'active' : ''} onClick={() => setShowTranslation(value => !value)}>{copy.translation}</button>
        </div>
      </header>

      <div className="guided-reader__layout">
        <div className="guided-reader__main">
          <div
            ref={setScrollContainer}
            className="guided-teleprompter"
            onPointerUp={handlePointerUp}
          >
            <div className="guided-teleprompter__spacer" />
            {article.segments.map((segment, index) => (
              <article
                key={`${article.id}-${index}`}
                className={`guided-segment${activeIndex === index ? ' guided-segment--active' : ''}`}
              >
                <button
                  className={`guided-segment__listen${ttsPlayback?.scope === 'segment' && ttsPlayback.index === index ? ' is-playing' : ''}`}
                  onClick={() => void playTts(index, 'segment')}
                  disabled={!hasSonioxKey}
                  aria-label={ttsPlayback?.scope === 'segment' && ttsPlayback.index === index
                    ? copy.stopVoice
                    : copy.listenSentence(index + 1)}
                  title={hasSonioxKey ? copy.listenSentence(index + 1) : copy.ttsKeyRequired}
                >
                  <AudioGlyph stop={ttsPlayback?.scope === 'segment' && ttsPlayback.index === index} />
                </button>
                <p className="guided-segment__hanzi" style={{ fontSize }}>
                  <HighlightableText text={segment.chinese} page_key={pageKey} />
                </p>
                {showPinyin && <p className="guided-segment__pinyin">{segment.pinyin}</p>}
                {showTranslation && segment.vietnamese && (
                  <p className="guided-segment__translation">{segment.vietnamese}</p>
                )}
              </article>
            ))}
            <div className="guided-teleprompter__spacer" />
          </div>

          <div className="guided-controls">
            <input
              className="guided-progress-range"
              type="range"
              min={0}
              max={totalChars}
              value={positionChars}
              onChange={event => seek(Number(event.target.value))}
              aria-label={copy.readingProgress}
            />
            <div className="guided-controls__row">
              <div className="guided-playback-actions">
                <button className="guided-icon-btn" onClick={() => moveSentence(-1)} title={copy.previousSentence}>‹</button>
                <button className="guided-play-btn" onClick={() => {
                  stopTts();
                  if (!playing && positionRef.current >= totalChars) seek(0);
                  setPlaying(value => !value);
                }}>
                  {playing ? copy.pause : positionChars >= totalChars ? copy.reread : copy.start}
                </button>
                <button className="guided-icon-btn" onClick={() => moveSentence(1)} title={copy.nextSentence}>›</button>

                <button
                  className={`guided-listen-all-btn${ttsPlayback?.scope === 'article' ? ' is-playing' : ''}`}
                  onClick={() => void playTts(0, 'article')}
                  disabled={!hasSonioxKey}
                  title={hasSonioxKey ? copy.listenAll : copy.ttsKeyRequired}
                >
                  <AudioGlyph stop={ttsPlayback?.scope === 'article'} />
                  {ttsLoading?.scope === 'article' ? copy.ttsGenerating : ttsPlayback?.scope === 'article' ? copy.stopVoice : copy.listenAll}
                </button>
              </div>

              <div className="guided-reading-settings">
                <label className="guided-control-field guided-control-field--tts">
                  <span>{copy.voice}</span>
                  <select value={ttsVoice} onChange={event => {
                    stopTts();
                    const voice = event.target.value;
                    setTtsVoice(voice);
                    try { localStorage.setItem(TTS_VOICE_KEY, voice); } catch { /* optional preference */ }
                  }}>
                    {ttsVoices.map(voice => (
                      <option key={voice.id} value={voice.id} title={voice.description}>
                        {voice.id}{voice.gender === 'female' ? ` · ${copy.femaleVoice}` : voice.gender === 'male' ? ` · ${copy.maleVoice}` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="guided-control-field guided-control-field--tts">
                  <span>{copy.voiceSpeed}</span>
                  <select value={ttsRate} onChange={event => setTtsRate(Number(event.target.value))}>
                    {[0.7, 0.85, 1, 1.15, 1.3].map(value => (
                      <option key={value} value={value}>{value}×</option>
                    ))}
                  </select>
                </label>

                <label className="guided-control-field">
                  <span>{copy.speed}</span>
                  <select value={speed} onChange={event => setSpeed(Number(event.target.value))}>
                    {[60, 80, 100, 120, 150, 180, 220, 260, 300].map(value => (
                      <option key={value} value={value}>{copy.charsPerMinute(value)}</option>
                    ))}
                  </select>
                </label>

                <label className="guided-control-field guided-control-field--font">
                  <span>{copy.fontSize}</span>
                  <input type="range" min={22} max={46} value={fontSize} onChange={event => setFontSize(Number(event.target.value))} />
                </label>
              </div>
            </div>
            {(ttsError || (!hasSonioxKey && copy.ttsKeyRequired)) && (
              <p className="guided-tts-note">{ttsError || copy.ttsKeyRequired}</p>
            )}
          </div>
        </div>

        <aside className="guided-vocab-sidebar">
          <SonioxReadCoach article={article} activeIndex={activeIndex} />
          <section>
            <div className="guided-sidebar-title">
              <h3>{copy.articleVocabulary}</h3>
              <span>{article.vocabulary.length}</span>
            </div>
            <div className="guided-vocab-list">
              {article.vocabulary.map(word => (
                <div key={word.hanzi} className="guided-vocab-item">
                  <div>
                    <strong>{word.hanzi}</strong>
                    <span className="guided-mini-level">{word.level}</span>
                  </div>
                  <em>{word.pinyin}</em>
                  <p>{word.meaning}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="guided-sidebar-title">
              <h3>{copy.unknownVocabulary}</h3>
              <span>{unknownWords.length}</span>
            </div>
            {unknownWords.length === 0 ? (
              <p className="guided-sidebar-empty">{copy.unknownHint}</p>
            ) : (
              <div className="guided-vocab-list">
                {unknownWords.map(highlight => {
                  const local = findLocalWord(highlight.text, vocabulary);
                  return (
                    <div key={highlight.id} className="guided-vocab-item guided-vocab-item--unknown">
                      <button onClick={() => void remove(highlight.id)} aria-label={copy.removeWord(highlight.text)}>×</button>
                      <div>
                        <strong>{highlight.text}</strong>
                        {local?.level && <span className="guided-mini-level">{local.level}</span>}
                      </div>
                      <em>{local?.pinyin || highlight.pinyin || '—'}</em>
                      <p>{local?.meaning || highlight.meaning || copy.missingMeaning}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
};

export const GuidedReadingModule: React.FC<Props> = ({ vocabulary, token, userId }) => {
  const { lang } = useLang();
  const copy = GUIDED_COPY[lang];
  const { apiKey, hasKey } = useApiKey();
  const { model } = useAIModel();
  const [articles, setArticles] = useState<GuidedReadingArticle[]>(() => loadGuidedArticles(vocabulary, userId));
  const [progress, setProgress] = useState<GuidedProgressMap>(loadGuidedProgress);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<GuidedLevel | 'all'>('all');
  const [extraLevel, setExtraLevel] = useState<GuidedLevel>('A1');
  const [generation, setGeneration] = useState<GenerationState>({
    running: false, done: 0, total: 0, errors: [],
  });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!token || userId == null) return;
    let cancelled = false;
    const localArticles = mergeGuidedArticles(
      vocabulary,
      loadGuidedArticles(vocabulary, userId),
      loadUnassignedGuidedArticles(),
    ).filter(isCustomGuidedArticle);

    void guidedReadingsApi.sync<GuidedReadingArticle>(token, localArticles)
      .then(records => {
        if (cancelled) return;
        setArticles(previous => {
          const next = mergeGuidedArticles(vocabulary, previous, records.map(record => record.article));
          saveGuidedArticles(next, userId);
          return next;
        });
        clearUnassignedGuidedArticles();
      })
      .catch(() => {
        // Keep the offline copy. A later login or module mount retries the sync.
      });

    return () => { cancelled = true; };
  }, [token, userId, vocabulary]);

  useEffect(() => {
    if (!selectedId) return;
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [selectedId]);

  const selected = articles.find(article => article.id === selectedId);
  const filtered = levelFilter === 'all'
    ? articles
    : articles.filter(article => article.level === levelFilter);

  const updateProgress = useCallback((articleId: string, value: GuidedReadingProgress) => {
    setProgress(previous => {
      const next = { ...previous, [articleId]: value };
      saveGuidedProgress(next);
      return next;
    });
  }, []);

  const generateArticles = async (tasks: ReturnType<typeof buildGuidedGenerationTasks>) => {
    if (!hasKey || !apiKey) return;
    if (tasks.length === 0) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setGeneration({ running: true, done: 0, total: tasks.length, errors: [] });

    let completed = 0;
    const errors: string[] = [];
    for (const task of tasks) {
      if (controller.signal.aborted) break;
      setGeneration(state => ({ ...state, currentLevel: task.level }));

      let article: GuidedReadingArticle | null = null;
      let lastError = '';
      for (let attempt = 1; attempt <= 3 && !article; attempt++) {
        try {
          article = await generateGuidedArticle(apiKey, model, task, controller.signal);
        } catch (error) {
          if (controller.signal.aborted) break;
          lastError = (error as Error).message;
        }
      }

      if (article) {
        setArticles(previous => {
          const next = [...previous, article!];
          saveGuidedArticles(next, userId);
          return next;
        });
        if (token) {
          await guidedReadingsApi.upsert(token, article).catch(() => {
            // The local copy remains safe and will be uploaded by the next bulk sync.
          });
        }
      } else if (!controller.signal.aborted) {
        errors.push(copy.articleFailure(task.level, task.ordinal + 1, lastError));
      }

      completed += 1;
      setGeneration({
        running: true,
        done: completed,
        total: tasks.length,
        currentLevel: task.level,
        errors: [...errors],
      });
    }

    abortRef.current = null;
    setGeneration(state => ({ ...state, running: false, currentLevel: undefined }));
  };

  const generateMissingArticles = () => {
    return generateArticles(buildGuidedGenerationTasks(vocabulary, articles));
  };

  const generateExtraArticle = () => {
    return generateArticles([buildGuidedExtraGenerationTask(vocabulary, articles, extraLevel)]);
  };

  if (selected) {
    return (
      <GuidedReader
        article={selected}
        vocabulary={vocabulary}
        token={token}
        savedProgress={progress[selected.id]}
        onBack={() => setSelectedId(null)}
        onProgress={updateProgress}
      />
    );
  }

  const completedCount = articles.filter(article => progress[article.id]?.completed).length;
  const remaining = Math.max(0, EXPECTED_COUNT - articles.length);

  return (
    <section className="guided-module">
      <div className="guided-hero">
        <div>
          <span className="guided-eyebrow">{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle(vocabulary.length.toLocaleString(NUMBER_LOCALES[lang]))}</p>
        </div>
        <div className="guided-stats">
          <div><strong>{articles.length}</strong><span>{copy.generated}</span></div>
          <div><strong>{completedCount}</strong><span>{copy.completed}</span></div>
          <div><strong>{remaining}</strong><span>{copy.remaining}</span></div>
        </div>
      </div>

      <div className="guided-generate-card">
        <div>
          <h2>{remaining > 0 ? copy.createSet(EXPECTED_COUNT) : copy.setReady}</h2>
          <p>
            {remaining > 0
              ? <>{copy.modelLabel}: <strong>{model}</strong>. {copy.modelNote}</>
              : copy.starterNote}
          </p>
        </div>
        {generation.running ? (
          <button className="guided-stop-btn" onClick={() => abortRef.current?.abort()}>{copy.stop}</button>
        ) : remaining > 0 ? (
          <button className="guided-primary-btn" disabled={!hasKey} onClick={() => void generateMissingArticles()}>
            {articles.length ? copy.createMissing(remaining) : copy.create(EXPECTED_COUNT)}
          </button>
        ) : (
          <div className="guided-extra-actions">
            <label>
              <span>{copy.chooseLevel}</span>
              <select value={extraLevel} onChange={event => setExtraLevel(event.target.value as GuidedLevel)}>
                {GUIDED_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
              </select>
            </label>
            <button className="guided-primary-btn" disabled={!hasKey} onClick={() => void generateExtraArticle()}>
              {copy.createMore}
            </button>
          </div>
        )}
      </div>

      {!hasKey && (
        <div className="guided-notice">{remaining > 0 ? copy.apiKeyNotice : copy.extraKeyNotice}</div>
      )}

      {(generation.running || generation.done > 0) && (
        <div className="guided-generation-progress">
          <div className="guided-generation-progress__row">
            <span>
              {generation.running ? copy.generating(generation.currentLevel ?? '') : copy.generationFinished}
            </span>
            <strong>{generation.done}/{generation.total}</strong>
          </div>
          <div className="guided-generation-progress__track">
            <span style={{ width: `${generation.total ? (generation.done / generation.total) * 100 : 0}%` }} />
          </div>
          {generation.errors.length > 0 && (
            <details>
              <summary>{copy.failed(generation.errors.length)}</summary>
              {generation.errors.map((error, index) => <p key={`${error}-${index}`}>{error}</p>)}
            </details>
          )}
        </div>
      )}

      <div className="guided-library-header">
        <div>
          <h2>{copy.library}</h2>
          <p>{copy.libraryHint}</p>
        </div>
        <div className="guided-level-filters">
          <button className={levelFilter === 'all' ? 'active' : ''} onClick={() => setLevelFilter('all')}>{copy.all}</button>
          {GUIDED_LEVELS.map(level => (
            <button key={level} className={levelFilter === level ? 'active' : ''} onClick={() => setLevelFilter(level)}>
              {level}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="guided-empty-library">
          <span>閱</span>
          <h3>{copy.empty(levelFilter === 'all' ? undefined : levelFilter)}</h3>
          <p>{copy.emptyHint}</p>
        </div>
      ) : (
        <div className="guided-article-grid">
          {filtered.map(article => {
            const itemProgress = progress[article.id];
            const length = articleTextLength(article);
            const percent = itemProgress?.completed
              ? 100
              : Math.round(((itemProgress?.positionChars ?? 0) / Math.max(1, length)) * 100);
            return (
              <button key={article.id} className="guided-article-card" onClick={() => setSelectedId(article.id)}>
                <div className="guided-article-card__top">
                  <span className="guided-level-badge">{article.level}</span>
                  {itemProgress?.completed && <span className="guided-done">{copy.read}</span>}
                </div>
                <h3>{article.title}</h3>
                <p>{article.topic}</p>
                <div className="guided-article-card__meta">
                  <span>{length} {copy.chars}</span>
                  <span>{article.segments.length} {copy.sentences}</span>
                  <span>{article.vocabulary.length} {copy.words}</span>
                </div>
                <div className="guided-card-progress"><span style={{ width: `${percent}%` }} /></div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
