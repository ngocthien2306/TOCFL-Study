import React, { useState, useRef, useEffect } from 'react';
import { useLang } from '../../i18n/LangContext';
import type { Lang } from '../../i18n/translations';
import { useApiKey } from '../../contexts/ApiKeyContext';
import { useAIModel } from '../../hooks/useAIModel';
import { useSonioxKey } from '../../contexts/SonioxKeyContext';
import type { AIModelId } from '../../hooks/useAIModel';
import { AI_MODELS } from '../../hooks/useAIModel';
import {
  IconKey, IconLock, IconUnlock, IconEye, IconEyeOff,
  IconClose, IconCheck, IconWarning, IconMic,
} from '../UI/Icons';

interface AuthUser { name: string; email: string }

interface Props {
  vocabCount:   number;
  user?:        AuthUser | null;
  onLoginClick: () => void;
  onLogout:     () => void;
}

const LANGS: { id: Lang; label: string }[] = [
  { id: 'vi', label: 'VI' },
  { id: 'zh', label: '中' },
  { id: 'en', label: 'EN' },
];

const TX = {
  login:        { vi: 'Đăng nhập',     zh: '登入',       en: 'Log in'         },
  logout:       { vi: 'Đăng xuất',     zh: '登出',       en: 'Log out'        },
  tagline:      { vi: 'Luyện thi TOCFL hiệu quả', zh: '高效備考 TOCFL', en: 'Master TOCFL effectively' },
  words:        { vi: 'từ vựng',       zh: '詞彙',       en: 'words'          },
  apiKey:       { vi: 'API Keys',       zh: 'API 金鑰',    en: 'API Keys'        },
  apiKeySet:    { vi: 'Đã cài API Key', zh: '已設定金鑰', en: 'API key set'    },
  apiKeySave:   { vi: 'Lưu',           zh: '儲存',        en: 'Save'           },
  apiKeyClear:  { vi: 'Xóa key',       zh: '清除金鑰',    en: 'Clear key'      },
  apiKeyRemember:{ vi: 'Nhớ key khi mở lại trình duyệt', zh: '重啟後記住金鑰', en: 'Remember after restart' },
  apiKeyNote:   { vi: 'Key chỉ dùng trong trình duyệt và không gửi lên backend của ứng dụng.', zh: '金鑰僅在瀏覽器中使用，不會傳送至本應用程式的後端。', en: 'Keys stay in your browser and are never sent to this app’s backend.' },
  apiKeyPlaceholder: { vi: 'sk-…', zh: 'sk-…', en: 'sk-…' },
  openAIModel: { vi: 'Model OpenAI', zh: 'OpenAI 模型', en: 'OpenAI model' },
  currentModel: { vi: 'Model hiện tại', zh: '目前模型', en: 'Current model' },
  sonioxCoach: { vi: 'Soniox · AI nghe đọc', zh: 'Soniox · AI 跟讀', en: 'Soniox · AI read-along' },
  sessionOnly: { vi: 'Key tự xóa khi đóng tab.', zh: '關閉分頁後將自動清除金鑰。', en: 'Keys are cleared when this tab closes.' },
} as const;

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ─── API Key Panel (popover) ──────────────────────────────────────────────────
const ApiKeyPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { lang } = useLang();
  const { apiKey, hasKey, persisted, setKey, clearKey } = useApiKey();
  const {
    sonioxKey, hasSonioxKey, persisted: sonioxPersisted,
    setSonioxKey, clearSonioxKey,
  } = useSonioxKey();
  const { model, setModel } = useAIModel();
  const [input,   setInput  ] = useState('');
  const [persist, setPersist] = useState(persisted);
  const [showKey, setShowKey] = useState(false);
  const [saved,   setSaved  ] = useState(false);
  const [sonioxInput, setSonioxInput] = useState('');
  const [sonioxPersist, setSonioxPersist] = useState(sonioxPersisted);
  const [showSonioxKey, setShowSonioxKey] = useState(false);
  const [sonioxSaved, setSonioxSaved] = useState(false);

  const maskedKey = apiKey ? `${apiKey.slice(0, 7)}${'•'.repeat(20)}` : '';

  const handleSave = () => {
    if (!input.trim()) return;
    setKey(input.trim(), persist);
    setInput('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => { clearKey(); setInput(''); };

  const handleSonioxSave = () => {
    if (!sonioxInput.trim()) return;
    setSonioxKey(sonioxInput, sonioxPersist);
    setSonioxInput('');
    setSonioxSaved(true);
    setTimeout(() => setSonioxSaved(false), 2000);
  };

  return (
    <div className="apikey-panel">
      <div className="apikey-panel-arrow" />

      <div className="apikey-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconKey size={15} />
          API Keys
        </span>
        <button className="apikey-close" onClick={onClose} aria-label="Close">
          <IconClose size={14} />
        </button>
      </div>

      {/* Current key status */}
      {hasKey && (
        <div className="apikey-status">
          <span className="apikey-status-dot" />
          <span className="apikey-masked">
            {showKey ? apiKey : maskedKey}
          </span>
          <button className="apikey-show-btn" onClick={() => setShowKey(v => !v)} aria-label="Toggle visibility">
            {showKey ? <IconEyeOff size={14} /> : <IconEye size={14} />}
          </button>
          <button className="apikey-clear-btn" onClick={handleClear}>
            {TX.apiKeyClear[lang]}
          </button>
        </div>
      )}

      {/* Input */}
      <div className="apikey-input-row">
        <input
          type="password"
          className="apikey-input"
          placeholder={TX.apiKeyPlaceholder[lang]}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          className={`apikey-save-btn${saved ? ' saved' : ''}`}
          onClick={handleSave}
          disabled={!input.trim()}
        >
          {saved
            ? <IconCheck size={14} />
            : TX.apiKeySave[lang]}
        </button>
      </div>

      {/* Persist toggle */}
      <label className="apikey-persist-row">
        <input
          type="checkbox"
          checked={persist}
          onChange={e => setPersist(e.target.checked)}
        />
        <span>{TX.apiKeyRemember[lang]}</span>
        {persist && <IconWarning size={13} className="apikey-persist-warn" />}
      </label>

      {/* AI Model selector */}
      <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 10 }}>
        <label style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>
          {TX.openAIModel[lang]}
        </label>
        <select
          value={model}
          onChange={e => setModel(e.target.value as AIModelId)}
          style={{
            width: '100%',
            padding: '7px 10px',
            borderRadius: 6,
            border: '1.5px solid var(--accent)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: '.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {AI_MODELS.map(m => (
            <option key={m.id} value={m.id}>
              {m.label} — {m.desc}
            </option>
          ))}
        </select>
        <div style={{ fontSize: '.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
          {TX.currentModel[lang]}: <strong style={{ color: 'var(--accent)' }}>{AI_MODELS.find(m => m.id === model)?.label}</strong>
        </div>
      </div>

      {/* Soniox key for Guided Reading live transcription */}
      <div className="apikey-service-section">
        <label className="apikey-service-label"><IconMic size={13} /> {TX.sonioxCoach[lang]}</label>
        {hasSonioxKey && (
          <div className="apikey-status">
            <span className="apikey-status-dot" />
            <span className="apikey-masked">{showSonioxKey ? sonioxKey : `${sonioxKey.slice(0, 6)}${'•'.repeat(18)}`}</span>
            <button className="apikey-show-btn" onClick={() => setShowSonioxKey(value => !value)} aria-label="Toggle Soniox key visibility">
              {showSonioxKey ? <IconEyeOff size={14} /> : <IconEye size={14} />}
            </button>
            <button className="apikey-clear-btn" onClick={clearSonioxKey}>{TX.apiKeyClear[lang]}</button>
          </div>
        )}
        <div className="apikey-input-row">
          <input
            type="password"
            className="apikey-input"
            placeholder="Soniox API Key…"
            value={sonioxInput}
            onChange={event => setSonioxInput(event.target.value)}
            onKeyDown={event => event.key === 'Enter' && handleSonioxSave()}
            autoComplete="off"
            spellCheck={false}
          />
          <button className={`apikey-save-btn${sonioxSaved ? ' saved' : ''}`} onClick={handleSonioxSave} disabled={!sonioxInput.trim()}>
            {sonioxSaved ? <IconCheck size={14} /> : TX.apiKeySave[lang]}
          </button>
        </div>
        <label className="apikey-persist-row">
          <input type="checkbox" checked={sonioxPersist} onChange={event => setSonioxPersist(event.target.checked)} />
          <span>{TX.apiKeyRemember[lang]}</span>
        </label>
      </div>

      {/* Security note */}
      <p className="apikey-note">
        <IconLock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
        {TX.apiKeyNote[lang]}
        {!persist && (
          <span className="apikey-session-note"> {TX.sessionOnly[lang]}</span>
        )}
      </p>
    </div>
  );
};

// ─── Main Header ──────────────────────────────────────────────────────────────
export const AppHeader: React.FC<Props> = ({ vocabCount, user, onLoginClick, onLogout }) => {
  const { lang, setLang } = useLang();
  const { hasKey } = useApiKey();
  const { hasSonioxKey } = useSonioxKey();
  const hasAnyKey = hasKey || hasSonioxKey;
  const [menuOpen,     setMenuOpen    ] = useState(false);
  const [keyPanelOpen, setKeyPanelOpen] = useState(false);
  const keyBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!keyPanelOpen) return;
    const handler = (e: MouseEvent) => {
      const panel = document.querySelector('.apikey-panel');
      if (panel && !panel.contains(e.target as Node) && !keyBtnRef.current?.contains(e.target as Node)) {
        setKeyPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [keyPanelOpen]);

  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Left: Brand */}
        <div className="header-brand">
          <div className="brand-logo"><span>T</span></div>
          <div className="brand-text">
            <div className="brand-name">TOCFL Study</div>
            <div className="brand-sub">
              {TX.tagline[lang]} · {vocabCount.toLocaleString()} {TX.words[lang]}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="header-right">
          {/* Language switcher */}
          <div className="lang-switcher">
            {LANGS.map(l => (
              <button
                key={l.id}
                className={`lang-btn${lang === l.id ? ' lang-btn--active' : ''}`}
                onClick={() => setLang(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* API Key button */}
          <div className="apikey-area">
            <button
              ref={keyBtnRef}
              className={`apikey-btn${hasAnyKey ? ' apikey-btn--set' : ''}${keyPanelOpen ? ' active' : ''}`}
              onClick={() => setKeyPanelOpen(v => !v)}
              title={hasAnyKey ? TX.apiKeySet[lang] : TX.apiKey[lang]}
            >
              <span className="apikey-btn-icon">
                {hasAnyKey ? <IconKey size={15} /> : <IconUnlock size={15} />}
              </span>
              <span className="apikey-btn-label">
                {hasAnyKey ? TX.apiKeySet[lang] : TX.apiKey[lang]}
              </span>
              {hasAnyKey && <span className="apikey-dot" />}
            </button>

            {keyPanelOpen && (
              <ApiKeyPanel onClose={() => setKeyPanelOpen(false)} />
            )}
          </div>

          {/* User */}
          {user ? (
            <div className="user-area">
              <button
                className="user-avatar"
                onClick={() => setMenuOpen(v => !v)}
                title={user.name}
              >
                {initials(user.name)}
              </button>
              {menuOpen && (
                <>
                  <div className="user-backdrop" onClick={() => setMenuOpen(false)} />
                  <div className="user-menu">
                    <div className="user-menu-info">
                      <div className="user-menu-name">{user.name}</div>
                      <div className="user-menu-email">{user.email}</div>
                    </div>
                    <button
                      className="user-menu-logout"
                      onClick={() => { setMenuOpen(false); onLogout(); }}
                    >
                      {TX.logout[lang]}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button className="header-login-btn" onClick={onLoginClick}>
              {TX.login[lang]}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
