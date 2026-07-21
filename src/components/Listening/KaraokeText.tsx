/**
 * KaraokeText — renders Chinese text char-by-char with two layers:
 *   1) Saved highlights (yellow background, like HighlightableText)
 *   2) Karaoke active char (blue background, follows audio currentTime)
 *
 * Falls back to HighlightableText when no `chars` timing is provided.
 *
 * Click on a saved-highlight char does nothing (delete-popup not wired here);
 * to delete, use the standalone HighlightableText regions or future global UI.
 */
import React, { useMemo } from 'react';
import { useHighlights } from '../../contexts/HighlightsContext';
import { HighlightableText } from '../HighlightableText';
import type { CharTiming } from '../../types';
import type { HighlightRecord } from '../../api/client';

interface Props {
  text:        string;
  chars?:      CharTiming[];
  pageKey:     string;
  currentTime: number;
}

const ACTIVE_BG = 'rgba(14, 165, 233, .42)';

export const KaraokeText: React.FC<Props> = ({ text, chars, pageKey, currentTime }) => {
  const { getForPage } = useHighlights();
  const pageHighlights = getForPage(pageKey);

  // No timing → standard HighlightableText (with click-to-delete saved highlights)
  if (!chars || chars.length === 0) {
    return <HighlightableText text={text} page_key={pageKey} />;
  }

  // Compute char-index ranges for saved highlights (against original text, not chars[])
  const ranges = useMemo<{ start: number; end: number; h: HighlightRecord }[]>(() => {
    const out: { start: number; end: number; h: HighlightRecord }[] = [];
    for (const h of pageHighlights) {
      let pos = -1;
      if (h.ctx_before) {
        const anchor = h.ctx_before + h.text;
        const i = text.indexOf(anchor);
        if (i !== -1) pos = i + h.ctx_before.length;
      }
      if (pos === -1) pos = text.indexOf(h.text);
      if (pos !== -1) out.push({ start: pos, end: pos + h.text.length, h });
    }
    return out.sort((a, b) => a.start - b.start);
  }, [text, pageHighlights]);

  function highlightAt(idx: number): HighlightRecord | null {
    for (const r of ranges) {
      if (idx >= r.start && idx < r.end) return r.h;
    }
    return null;
  }

  return (
    <span data-page-key={pageKey} data-highlightable="true">
      {chars.map((c, i) => {
        const active = c.start !== undefined && c.end !== undefined &&
                       currentTime >= c.start && currentTime <= c.end;
        const hl = highlightAt(i);
        const bg = hl ? hl.color : (active ? ACTIVE_BG : undefined);
        return (
          <span
            key={i}
            style={{
              background:    bg,
              borderRadius:  hl || active ? 2 : undefined,
              transition:    'background .12s',
            }}
          >
            {c.char}
          </span>
        );
      })}
    </span>
  );
};

