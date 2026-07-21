import React, { useState, useCallback, useEffect, useRef } from 'react';
import { KaraokeText } from './KaraokeText';
import type { ExamKey, TranscriptBlock, TranscriptDialogueLine, OptionKey } from '../../types';
import { useQuestionTranscript } from '../../hooks/useTranscript';

const WARNED_KEY = 'tocfl_transcript_warned';

interface Props {
  band:        'A' | 'B' | 'C';
  examKey:     ExamKey;
  questionId:  number;
  /** Cumulative seconds across the question's audio playlist (for karaoke highlight) */
  currentTime?: number;
}

export const OfficialTranscript: React.FC<Props> = ({ band, examKey, questionId, currentTime = 0 }) => {
  const item = useQuestionTranscript(band, examKey, questionId);
  const [revealed, setRevealed] = useState(false);

  const onReveal = useCallback(() => {
    const warned = localStorage.getItem(WARNED_KEY) === '1';
    if (!warned) {
      const ok = window.confirm(
        '📜 Xem văn bản gốc có thể giảm hiệu quả luyện nghe vì bạn không còn phải đoán nội dung audio.\n\n' +
        'Bạn vẫn muốn xem?',
      );
      if (!ok) return;
      localStorage.setItem(WARNED_KEY, '1');
    }
    setRevealed(true);
  }, []);

  if (!item) {
    // Either still loading, or no official transcript exists for this question
    return null;
  }

  const pageKeyPrefix = `transcript_${band}_${examKey}_q${questionId}`;

  return (
    <div style={{
      marginBottom: 12, borderRadius: 8,
      border: '1px solid var(--border)', overflow: 'hidden',
    }}>
      {/* Header / toggle */}
      <button
        type="button"
        onClick={() => (revealed ? setRevealed(false) : onReveal())}
        style={{
          width: '100%', padding: '8px 12px', textAlign: 'left',
          background: revealed ? 'var(--accent-light)' : 'var(--bg)',
          border: 'none', borderBottom: revealed ? '1px solid var(--border)' : 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '.78rem', fontWeight: 600, color: 'var(--text)',
        }}
      >
        <span>📜 Văn bản gốc {item.ids.length > 1 && `(câu ${item.ids.join('–')})`}</span>
        <span style={{ fontSize: '.72rem', color: 'var(--text-secondary)' }}>{revealed ? 'Ẩn ▲' : 'Hiện ▼'}</span>
      </button>

      {revealed && (
        <div style={{ padding: '10px 12px', background: 'var(--surface)' }}>
          {item.blocks.map((block, i) => (
            <BlockRenderer
              key={i}
              block={block}
              pageKeyPrefix={`${pageKeyPrefix}_b${i}`}
              currentTime={currentTime}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Karaoke helpers ──────────────────────────────────────────────────────────

function isActive(start: number | undefined, end: number | undefined, t: number): boolean {
  if (start === undefined || end === undefined) return false;
  return t >= start && t <= end;
}

function useScrollIntoView(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (active && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [active]);
  return ref;
}

const ACTIVE_BG    = 'rgba(14, 165, 233, .18)';
const ACTIVE_RING  = '0 0 0 2px rgba(14, 165, 233, .4)';

// ── Block renderer ───────────────────────────────────────────────────────────

const BlockRenderer: React.FC<{
  block: TranscriptBlock;
  pageKeyPrefix: string;
  currentTime: number;
}> = ({ block, pageKeyPrefix, currentTime }) => {
  if (block.kind === 'narration') {
    const active = isActive(block.start, block.end, currentTime);
    const ref = useScrollIntoView(active);
    return (
      <div ref={ref} style={{
        marginBottom: 8, padding: '6px 10px', borderRadius: 6,
        background: active ? ACTIVE_BG : 'var(--bg)',
        borderLeft: '3px solid var(--accent)',
        boxShadow: active ? ACTIVE_RING : 'none',
        fontSize: '.83rem', color: 'var(--text-secondary)', fontStyle: 'italic',
        transition: 'background .2s, box-shadow .2s',
      }}>
        <KaraokeText
          text={block.text}
          chars={block.chars}
          pageKey={`${pageKeyPrefix}_n`}
          currentTime={currentTime}
        />
      </div>
    );
  }

  if (block.kind === 'dialogue') {
    return (
      <div style={{ marginBottom: 8 }}>
        {block.lines.map((line, i) => (
          <DialogueLineRow
            key={i}
            line={line}
            currentTime={currentTime}
            pageKey={`${pageKeyPrefix}_d${i}`}
          />
        ))}
      </div>
    );
  }

  // qa block
  const active = isActive(block.start, block.end, currentTime);
  const ref = useScrollIntoView(active);
  return (
    <div ref={ref} style={{
      marginBottom: 8, padding: '6px 10px', borderRadius: 6,
      background: active ? ACTIVE_BG : 'var(--accent-light)',
      boxShadow: active ? ACTIVE_RING : 'none',
      fontSize: '.85rem', fontWeight: 600,
      transition: 'background .2s, box-shadow .2s',
    }}>
      <span style={{ marginRight: 6, color: 'var(--accent)', userSelect: 'none' }}>❓</span>
      <KaraokeText
        text={block.question}
        chars={block.chars}
        pageKey={`${pageKeyPrefix}_q`}
        currentTime={currentTime}
      />
      {block.options && (
        <div style={{ marginTop: 6, paddingLeft: 18, fontWeight: 400, fontSize: '.82rem' }}>
          {(['A', 'B', 'C', 'D'] as OptionKey[]).map(k => block.options?.[k] && (
            <div key={k} style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
              <span style={{ fontWeight: 700, color: 'var(--accent)', userSelect: 'none' }}>({k})</span>
              <KaraokeText
                text={block.options[k]!}
                chars={block.optionsTimings?.[k]?.chars}
                pageKey={`${pageKeyPrefix}_o${k}`}
                currentTime={currentTime}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DialogueLineRow: React.FC<{
  line: TranscriptDialogueLine;
  currentTime: number;
  pageKey: string;
}> = ({ line, currentTime, pageKey }) => {
  const active = isActive(line.start, line.end, currentTime);
  const ref = useScrollIntoView(active);
  return (
    <div ref={ref} style={{
      display: 'flex', gap: 10, marginBottom: 4, fontSize: '.85rem', lineHeight: 1.55,
      padding: '2px 6px', borderRadius: 4,
      background: active ? ACTIVE_BG : 'transparent',
      boxShadow: active ? ACTIVE_RING : 'none',
      transition: 'background .2s, box-shadow .2s',
    }}>
      <span style={{
        flexShrink: 0, width: 28, textAlign: 'center',
        fontWeight: 700, color: line.speaker.startsWith('男') ? '#0ea5e9' : '#ec4899',
        userSelect: 'none',
      }}>{line.speaker}</span>
      <KaraokeText
        text={line.text}
        chars={line.chars}
        pageKey={pageKey}
        currentTime={currentTime}
      />
    </div>
  );
};
