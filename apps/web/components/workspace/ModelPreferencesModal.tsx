'use client';

import Image from 'next/image';
import { type AIModel } from '@vel-ai/shared/types/models';
import { useModelPreferencesStore } from '@/lib/stores/model-preferences.store';

interface ModelPreferencesModalProps {
  open: boolean;
  onClose: () => void;
  models: AIModel[];
}

const PROVIDER_LOGO: Record<string, string> = {
  openai: '/logos/gpt.svg',
  anthropic: '/logos/claude.svg',
  google: '/logos/gemini.svg',
  deepseek: '/logos/qwen.svg',
  perplexity: '/logos/qwen.svg',
  xai: '/logos/kimi.svg',
  meta: '/logos/qwen.svg',
  mistral: '/logos/kimi.svg',
};

export function ModelPreferencesModal({
  open,
  onClose,
  models,
}: ModelPreferencesModalProps) {
  const { enabledModelIds, toggleModelEnabled, setEnabledModelIds } =
    useModelPreferencesStore();

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,10,10,0.72)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(740px, 100%)',
          maxHeight: '88vh',
          overflowY: 'auto',
          borderRadius: 14,
          border: '1px solid var(--vel-border-subtle)',
          background: 'var(--vel-surface)',
          boxShadow: 'var(--vel-tile-shadow)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '18px 20px 10px',
            borderBottom: '1px solid var(--vel-border-subtle)',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 22,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                color: 'var(--vel-text)',
              }}
            >
              AI model preferences
            </h3>
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 13,
                color: 'var(--vel-text-muted)',
              }}
            >
              Manage and enable only the models you use in this project.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--vel-text-secondary)',
              fontSize: 24,
              lineHeight: 1,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '14px 16px 16px' }}>
          {models.map((model) => {
            const enabled = enabledModelIds.includes(model.id);
            const logo = PROVIDER_LOGO[model.provider];

            return (
              <div
                key={model.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px 1fr auto auto',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--vel-border-subtle)',
                  marginBottom: 8,
                  background: 'var(--vel-card)',
                }}
              >
                <span
                  style={{
                    color: 'var(--vel-text-disabled)',
                    fontSize: 18,
                    userSelect: 'none',
                    textAlign: 'center',
                  }}
                >
                  ⋮⋮
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 7,
                      border: '1px solid var(--vel-border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(255,255,255,0.02)',
                      overflow: 'hidden',
                    }}
                  >
                    {logo ? (
                      <Image src={logo} alt={model.name} width={24} height={24} />
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--vel-text-muted)' }}>
                        {model.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: 'var(--vel-text)',
                    }}
                  >
                    {model.name}
                  </span>
                </div>

                <div
                  style={{
                    border: '1px solid var(--vel-border-subtle)',
                    background: 'var(--vel-card-elevated)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontSize: 12,
                    color: 'var(--vel-text-secondary)',
                    minWidth: 116,
                    textAlign: 'center',
                    textTransform: 'capitalize',
                  }}
                >
                  {model.provider}
                </div>

                <button
                  onClick={() => toggleModelEnabled(model.id)}
                  role="switch"
                  aria-checked={enabled}
                  style={{
                    width: 56,
                    height: 30,
                    borderRadius: 99,
                    border: '1px solid var(--vel-border-subtle)',
                    background: enabled
                      ? 'var(--vel-violet-alpha-20)'
                      : 'rgba(255,255,255,0.06)',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 160ms ease',
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: enabled
                        ? 'var(--vel-violet-bright)'
                        : 'var(--vel-text-secondary)',
                      position: 'absolute',
                      top: 2,
                      left: enabled ? 30 : 2,
                      transition: 'all 160ms ease',
                    }}
                  />
                </button>
              </div>
            );
          })}

          <div
            style={{
              display: 'flex',
              gap: 10,
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid var(--vel-border-subtle)',
            }}
          >
            <button
              onClick={() => setEnabledModelIds(models.map((m) => m.id))}
              className="btn-ghost"
              style={{
                flex: 1,
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Enable all shown models
            </button>
            <button
              onClick={onClose}
              className="btn-primary"
              style={{
                flex: 1,
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Update preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
