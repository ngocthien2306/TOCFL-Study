import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Recording } from '@soniox/client';
import { useSonioxKey } from '../../contexts/SonioxKeyContext';
import { useLang } from '../../i18n/LangContext';
import type { Lang } from '../../i18n/translations';
import { IconCheck, IconEye, IconEyeOff, IconKey, IconLock, IconMic } from '../UI/Icons';
import { deleteGuidedRecording, loadGuidedRecording, saveGuidedRecording } from './recordingStorage';
import type { GuidedReadingArticle } from './types';

interface Props {
  article: GuidedReadingArticle;
  activeIndex: number;
}

type CoachState = 'idle' | 'starting' | 'listening' | 'stopping' | 'error';

const COPY: Record<Lang, {
  title: string;
  subtitle: string;
  keyLabel: string;
  keyPlaceholder: string;
  remember: string;
  save: string;
  clear: string;
  start: string;
  starting: string;
  stop: string;
  stopping: string;
  listening: string;
  transcript: string;
  waiting: string;
  match: string;
  matched: string;
  missing: string;
  note: string;
  permission: string;
  savedRecording: string;
  deleteRecording: string;
  recordingWarning: string;
  recordingPlaybackError: string;
}> = {
  vi: {
    title: 'AI nghe bạn đọc', subtitle: 'Soniox đối chiếu lời đọc với câu hiện tại.',
    keyLabel: 'Soniox API Key', keyPlaceholder: 'Nhập Soniox API Key…', remember: 'Ghi nhớ key trên trình duyệt này',
    save: 'Lưu key', clear: 'Đổi key', start: 'Bắt đầu nghe', starting: 'Đang kết nối…', stop: 'Dừng nghe', stopping: 'Đang hoàn tất…',
    listening: 'Đang nghe', transcript: 'AI nghe được', waiting: 'Hãy đọc câu đang được tô sáng…', match: 'Độ khớp câu hiện tại',
    matched: 'ký tự khớp', missing: 'Cần đọc lại', note: 'Chỉ đối chiếu nội dung chữ; chưa chấm thanh điệu hay chất lượng phát âm.',
    permission: 'Không thể dùng micro. Hãy cho phép quyền micro rồi thử lại.',
    savedRecording: 'Bản thu gần nhất', deleteRecording: 'Xoá bản thu',
    recordingWarning: 'Trình duyệt không hỗ trợ lưu bản thu, nhưng Soniox vẫn tiếp tục nghe.',
    recordingPlaybackError: 'Bản thu cũ dùng định dạng không tương thích. Hãy xoá và thu lại một lần.',
  },
  zh: {
    title: 'AI 聽您朗讀', subtitle: 'Soniox 會將朗讀內容與目前句子比對。',
    keyLabel: 'Soniox API 金鑰', keyPlaceholder: '輸入 Soniox API 金鑰…', remember: '在此瀏覽器記住金鑰',
    save: '儲存金鑰', clear: '更換金鑰', start: '開始聆聽', starting: '正在連線…', stop: '停止聆聽', stopping: '正在完成…',
    listening: '正在聆聽', transcript: 'AI 聽到的內容', waiting: '請朗讀目前標示的句子…', match: '目前句子吻合度',
    matched: '個字吻合', missing: '建議重讀', note: '僅比對文字內容；目前不評估聲調或發音品質。',
    permission: '無法使用麥克風，請允許麥克風權限後再試。',
    savedRecording: '最近一次錄音', deleteRecording: '刪除錄音',
    recordingWarning: '此瀏覽器不支援儲存錄音，但 Soniox 仍會繼續聆聽。',
    recordingPlaybackError: '舊錄音格式不相容，請刪除後重新錄製一次。',
  },
  en: {
    title: 'AI read-along coach', subtitle: 'Soniox compares your reading with the current sentence.',
    keyLabel: 'Soniox API key', keyPlaceholder: 'Enter your Soniox API key…', remember: 'Remember key in this browser',
    save: 'Save key', clear: 'Change key', start: 'Start listening', starting: 'Connecting…', stop: 'Stop listening', stopping: 'Finishing…',
    listening: 'Listening', transcript: 'AI heard', waiting: 'Read the highlighted sentence…', match: 'Current sentence match',
    matched: 'characters matched', missing: 'Read again', note: 'Text matching only; tones and pronunciation quality are not scored yet.',
    permission: 'Microphone access failed. Allow microphone permission and try again.',
    savedRecording: 'Latest recording', deleteRecording: 'Delete recording',
    recordingWarning: 'This browser cannot save the recording, but Soniox will keep listening.',
    recordingPlaybackError: 'The previous recording uses an unsupported format. Delete it and record once more.',
  },
};

function hanCharacters(text: string): string[] {
  return Array.from(text).filter(character => /\p{Script=Han}/u.test(character));
}

function lcsMatches(expected: string[], spoken: string[]): Set<number> {
  const rows = expected.length + 1;
  const cols = spoken.length + 1;
  const table = Array.from({ length: rows }, () => new Uint16Array(cols));

  for (let row = 1; row < rows; row++) {
    for (let col = 1; col < cols; col++) {
      table[row][col] = expected[row - 1] === spoken[col - 1]
        ? table[row - 1][col - 1] + 1
        : Math.max(table[row - 1][col], table[row][col - 1]);
    }
  }

  const matches = new Set<number>();
  let row = expected.length;
  let col = spoken.length;
  while (row > 0 && col > 0) {
    if (expected[row - 1] === spoken[col - 1]) {
      matches.add(row - 1);
      row--;
      col--;
    } else if (table[row - 1][col] >= table[row][col - 1]) row--;
    else col--;
  }
  return matches;
}

export const SonioxReadCoach: React.FC<Props> = ({ article, activeIndex }) => {
  const { lang } = useLang();
  const copy = COPY[lang];
  const { sonioxKey, hasSonioxKey, persisted, setSonioxKey, clearSonioxKey } = useSonioxKey();
  const [input, setInput] = useState('');
  const [remember, setRemember] = useState(persisted);
  const [showKey, setShowKey] = useState(false);
  const [state, setState] = useState<CoachState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [recordedAt, setRecordedAt] = useState('');
  const [recordingPlaybackError, setRecordingPlaybackError] = useState('');
  const recordingRef = useRef<Recording | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const localFinishRef = useRef<Promise<void> | null>(null);
  const recordingUrlRef = useRef('');
  const finalTextRef = useRef('');

  const expected = useMemo(
    () => hanCharacters(article.segments[activeIndex]?.chinese ?? ''),
    [activeIndex, article.segments],
  );
  const recentSpoken = useMemo(() => {
    const characters = hanCharacters(transcript);
    return characters.slice(-Math.max(expected.length * 2, 30));
  }, [expected.length, transcript]);
  const matchedIndexes = useMemo(() => lcsMatches(expected, recentSpoken), [expected, recentSpoken]);
  const matchPercent = expected.length ? Math.round((matchedIndexes.size / expected.length) * 100) : 0;

  useEffect(() => {
    setTranscript('');
    finalTextRef.current = '';
  }, [activeIndex]);

  useEffect(() => {
    let cancelled = false;
    void loadGuidedRecording(article.id).then(saved => {
      if (cancelled || !saved) return;
      if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
      const url = URL.createObjectURL(saved.blob);
      recordingUrlRef.current = url;
      setRecordingUrl(url);
      setRecordedAt(saved.createdAt);
      const audio = document.createElement('audio');
      setRecordingPlaybackError(audio.canPlayType(saved.blob.type) ? '' : copy.recordingPlaybackError);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [article.id, copy.recordingPlaybackError]);

  useEffect(() => () => {
    recordingRef.current?.cancel();
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder?.state !== 'inactive') mediaRecorder?.stop();
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
  }, []);

  const finishLocalRecording = (): Promise<void> => {
    if (localFinishRef.current) return localFinishRef.current;
    const finish = (async () => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder) return;
      const blob = await new Promise<Blob | null>(resolve => {
        if (mediaRecorder.state === 'inactive') {
          resolve(audioChunksRef.current.length ? new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType }) : null);
          return;
        }
        mediaRecorder.addEventListener('stop', () => {
          resolve(audioChunksRef.current.length ? new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType }) : null);
        }, { once: true });
        mediaRecorder.stop();
      });
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;
      audioChunksRef.current = [];
      if (!blob || blob.size === 0) return;
      const saved = await saveGuidedRecording(article.id, blob);
      if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
      const url = URL.createObjectURL(saved.blob);
      recordingUrlRef.current = url;
      setRecordingUrl(url);
      setRecordedAt(saved.createdAt);
      setRecordingPlaybackError('');
    })();
    localFinishRef.current = finish;
    void finish.finally(() => {
      if (localFinishRef.current === finish) localFinishRef.current = null;
    });
    return finish;
  };

  const startLocalRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError(copy.recordingWarning);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audio = document.createElement('audio');
    const mimeType = [
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mp4',
      'audio/webm;codecs=opus',
      'audio/webm',
    ].find(type => MediaRecorder.isTypeSupported(type) && audio.canPlayType(type) !== '');
    if (!mimeType) {
      stream.getTracks().forEach(track => track.stop());
      setError(copy.recordingWarning);
      return;
    }
    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    localFinishRef.current = null;
    mediaStreamRef.current = stream;
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];
    mediaRecorder.ondataavailable = event => {
      if (event.data.size) audioChunksRef.current.push(event.data);
    };
    // A single finalized chunk is more reliable for MP4/AAC playback, especially on Safari.
    mediaRecorder.start();
  };

  const saveKey = () => {
    if (!input.trim()) return;
    setSonioxKey(input, remember);
    setInput('');
  };

  const stop = async () => {
    const recording = recordingRef.current;
    if (!recording) return;
    setState('stopping');
    try {
      await recording.stop();
      setState('idle');
    } catch (stopError) {
      setError(stopError instanceof Error ? stopError.message : String(stopError));
      setState('error');
    } finally {
      recordingRef.current = null;
      await finishLocalRecording().catch(storageError => {
        setError(storageError instanceof Error ? storageError.message : String(storageError));
      });
    }
  };

  const start = async () => {
    if (!sonioxKey || recordingRef.current) return;
    setState('starting');
    setError('');
    setTranscript('');
    finalTextRef.current = '';

    try {
      await startLocalRecording();
      const { BrowserPermissionResolver, SonioxClient } = await import('@soniox/client');
      const client = new SonioxClient({
        config: { api_key: sonioxKey },
        permissions: new BrowserPermissionResolver(),
      });
      const recording = client.realtime.record({
        model: 'stt-rt-v5',
        language_hints: ['zh'],
        language_hints_strict: true,
        enable_endpoint_detection: true,
        max_endpoint_delay_ms: 1200,
        context: {
          general: [{ key: 'domain', value: 'Traditional Chinese language reading practice' }],
          text: article.segments.map(segment => segment.chinese).join(''),
          terms: article.vocabulary.map(word => word.hanzi).slice(0, 100),
        },
        auto_reconnect: true,
        max_reconnect_attempts: 2,
      });

      recordingRef.current = recording;
      recording.on('connected', () => setState('listening'));
      recording.on('result', result => {
        const finalized = result.tokens.filter(token => token.is_final).map(token => token.text).join('');
        const partial = result.tokens.filter(token => !token.is_final).map(token => token.text).join('');
        if (finalized) finalTextRef.current += finalized;
        setTranscript(`${finalTextRef.current}${partial}`);
      });
      recording.on('error', recordingError => {
        recordingRef.current = null;
        void finishLocalRecording().catch(storageError => {
          setError(storageError instanceof Error ? storageError.message : String(storageError));
        });
        setError(recordingError.message || copy.permission);
        setState('error');
      });
      recording.on('finished', () => {
        recordingRef.current = null;
        void finishLocalRecording().catch(storageError => {
          setError(storageError instanceof Error ? storageError.message : String(storageError));
        });
        setState('idle');
      });
    } catch (startError) {
      recordingRef.current = null;
      await finishLocalRecording().catch(() => undefined);
      setError(startError instanceof Error ? startError.message : copy.permission);
      setState('error');
    }
  };

  return (
    <section className="guided-ai-coach">
      <div className="guided-ai-coach__heading">
        <span className={`guided-ai-coach__mic${state === 'listening' ? ' is-live' : ''}`}><IconMic size={17} /></span>
        <div><h3>{copy.title}</h3><p>{copy.subtitle}</p></div>
      </div>

      {!hasSonioxKey ? (
        <div className="guided-ai-key-form">
          <label>{copy.keyLabel}</label>
          <div className="guided-ai-key-input">
            <IconKey size={14} />
            <input
              type={showKey ? 'text' : 'password'}
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={event => event.key === 'Enter' && saveKey()}
              placeholder={copy.keyPlaceholder}
              autoComplete="off"
              spellCheck={false}
            />
            <button onClick={() => setShowKey(value => !value)} aria-label="Toggle key visibility">
              {showKey ? <IconEyeOff size={14} /> : <IconEye size={14} />}
            </button>
          </div>
          <label className="guided-ai-remember">
            <input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} />
            <span>{copy.remember}</span>
          </label>
          <button className="guided-ai-save" disabled={!input.trim()} onClick={saveKey}>{copy.save}</button>
        </div>
      ) : (
        <>
          <div className="guided-ai-coach__actions">
            {state === 'listening' || state === 'starting' ? (
              <button className="guided-ai-stop" onClick={() => void stop()} disabled={state === 'starting'}>
                {state === 'starting' ? copy.starting : copy.stop}
              </button>
            ) : state === 'stopping' ? (
              <button disabled>{copy.stopping}</button>
            ) : (
              <button className="guided-ai-start" onClick={() => void start()}><IconMic size={15} />{copy.start}</button>
            )}
            <button className="guided-ai-change-key" onClick={clearSonioxKey}>{copy.clear}</button>
          </div>

          {state === 'listening' && <div className="guided-ai-live"><span />{copy.listening}</div>}
          <div className="guided-ai-match-row">
            <span>{copy.match}</span><strong>{matchPercent}%</strong>
          </div>
          <div className="guided-ai-match-track"><span style={{ width: `${matchPercent}%` }} /></div>

          <div className="guided-ai-character-line" aria-label={`${matchedIndexes.size} ${copy.matched}`}>
            {expected.map((character, index) => (
              <span key={`${character}-${index}`} className={matchedIndexes.has(index) ? 'is-matched' : ''}>{character}</span>
            ))}
          </div>
          <div className="guided-ai-transcript">
            <span>{copy.transcript}</span>
            <p>{transcript || copy.waiting}</p>
          </div>
          {recordingUrl && (
            <div className="guided-ai-recording">
              <div>
                <span>{copy.savedRecording}</span>
                {recordedAt && <time dateTime={recordedAt}>{new Date(recordedAt).toLocaleString(lang === 'vi' ? 'vi-VN' : lang === 'zh' ? 'zh-TW' : 'en-US')}</time>}
              </div>
              <audio
                key={recordingUrl}
                controls
                preload="metadata"
                src={recordingUrl}
                onCanPlay={() => setRecordingPlaybackError('')}
                onError={() => setRecordingPlaybackError(copy.recordingPlaybackError)}
              />
              {recordingPlaybackError && <p className="guided-ai-recording__error">{recordingPlaybackError}</p>}
              <button onClick={() => {
                void deleteGuidedRecording(article.id).then(() => {
                  if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current);
                  recordingUrlRef.current = '';
                  setRecordingUrl('');
                  setRecordedAt('');
                  setRecordingPlaybackError('');
                });
              }}>{copy.deleteRecording}</button>
            </div>
          )}
          {error && <p className="guided-ai-error">{error}</p>}
          <p className="guided-ai-note"><IconLock size={11} />{copy.note}</p>
          {matchPercent >= 90 && <div className="guided-ai-success"><IconCheck size={13} /> {matchPercent}%</div>}
        </>
      )}
    </section>
  );
};
