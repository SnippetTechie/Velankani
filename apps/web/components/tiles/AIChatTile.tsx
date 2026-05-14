'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useAIStream } from '@/lib/hooks/useAIStream';
import { useCreditStore } from '@/lib/stores/credits.store';
import { useActivityStore } from '@/lib/stores/activity.store';
import { useCanvasStore } from '@/lib/stores/canvas.store';
import { useModelPreferencesStore } from '@/lib/stores/model-preferences.store';
import { getModel, getAvailableModels } from '@vel-ai/shared/types/models';

interface AIChatTileData {
  model: string;
  label?: string;
  workspaceId: string;
  contextSources?: string[];
}

function AIChatTile({ id, data, selected }: NodeProps<AIChatTileData>) {
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [contextFlash, setContextFlash] = useState(false);
  const [currentModel, setCurrentModel] = useState(
    data.model || 'claude-sonnet-4',
  );
  const [showModelPicker, setShowModelPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { stream } = useAIStream();
  const { deductPreview } = useCreditStore();
  const { addEvent } = useActivityStore();
  const { getContextSources } = useCanvasStore();
  const allowedModelIds = useModelPreferencesStore((state) => state.allowedModelIds);
  const enabledModelIds = useModelPreferencesStore((state) => state.enabledModelIds);
  const availableModels = getAvailableModels();
  const scopedModels =
    allowedModelIds.length > 0
      ? availableModels.filter((m) => allowedModelIds.includes(m.id))
      : availableModels;
  const selectableModels =
    enabledModelIds.length > 0
      ? scopedModels.filter((m) => enabledModelIds.includes(m.id))
      : scopedModels;
  const model = getModel(currentModel);

  useEffect(() => {
    if (selectableModels.length === 0) return;
    const stillAvailable = selectableModels.some((m) => m.id === currentModel);
    if (!stillAvailable) {
      setCurrentModel(selectableModels[0].id);
    }
  }, [currentModel, selectableModels]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;
    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsStreaming(true);

    deductPreview(model?.creditsPerMessage || 8);
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    const contextSources = getContextSources(id);

    await stream({
      model: currentModel,
      messages: [...messages, { role: 'user', content: userMessage }],
      tileId: id,
      workspaceId: data.workspaceId,
      contextSources,
      onDelta: (delta) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = {
            ...last,
            content: last.content + delta,
          };
          return updated;
        });
      },
      onContextInjected: () => {
        setContextFlash(true);
        setTimeout(() => setContextFlash(false), 3000);
      },
      onDone: (tokens) => {
        setIsStreaming(false);
        addEvent({
          type: 'completion',
          message: `${model?.name} completed (${tokens} tokens)`,
          tileId: id,
          model: currentModel,
        });
      },
      onError: (err) => {
        setIsStreaming(false);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: `⚠️ Error: ${err}`,
          };
          return updated;
        });
      },
    });
  }, [
    input,
    isStreaming,
    messages,
    currentModel,
    id,
    data,
    model,
    stream,
    deductPreview,
    addEvent,
    getContextSources,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const modelColor = model?.color || '#8B5CF6';

  return (
    <div
      className="vel-tile tile-spawn"
      style={{
        width: 380,
        minHeight: 480,
        maxHeight: 700,
        borderColor: selected
          ? 'var(--vel-border-active)'
          : 'var(--vel-border-subtle)',
        borderLeftColor: modelColor,
        borderLeftWidth: 3,
        boxShadow: selected
          ? `var(--shadow-tile), 0 0 32px ${modelColor}25`
          : 'var(--shadow-tile)',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: modelColor,
          border: 'none',
          width: 10,
          height: 10,
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: modelColor,
          border: 'none',
          width: 10,
          height: 10,
        }}
      />

      {/* Context flash */}
      <AnimatePresence>
        {contextFlash && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              position: 'absolute',
              top: 40,
              left: 0,
              right: 0,
              background: 'rgba(109, 95, 255, 0.15)',
              borderBottom: '1px solid rgba(109, 95, 255, 0.3)',
              padding: '6px 14px',
              fontSize: 12,
              color: '#A78BFA',
              zIndex: 10,
            }}
          >
            ⚡ Context injected from connected tile
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid var(--vel-border-subtle)',
          position: 'relative',
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          onClick={() => setShowModelPicker(!showModelPicker)}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: modelColor,
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            {model?.name || 'AI Chat'}
          </span>
          <span style={{ fontSize: 10, color: 'var(--vel-text-muted)' }}>▼</span>
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--vel-text-muted)',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {model?.creditsPerMessage || 0}cr
        </div>

        {/* Model picker dropdown */}
        <AnimatePresence>
          {showModelPicker && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--vel-bg-elevated)',
                border: '1px solid var(--vel-border-default)',
                borderRadius: 8,
                padding: 4,
                zIndex: 20,
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              {selectableModels.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setCurrentModel(m.id);
                    setShowModelPicker(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '6px 10px',
                    background:
                      m.id === currentModel
                        ? 'var(--vel-accent-muted)'
                        : 'transparent',
                    border: 'none',
                    borderRadius: 6,
                    color: 'var(--vel-text-primary)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontFamily: 'DM Sans, sans-serif',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: m.color,
                    }}
                  />
                  {m.name}
                  <span
                    style={{
                      marginLeft: 'auto',
                      color: 'var(--vel-text-muted)',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 10,
                    }}
                  >
                    {m.creditsPerMessage}cr
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Messages */}
      <div
        className="nodrag nowheel"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--vel-text-muted)',
              textAlign: 'center',
              padding: '40px 20px',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: `${modelColor}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                fontSize: 18,
              }}
            >
              ✦
            </div>
            <p style={{ fontSize: 13, margin: 0 }}>
              {model?.name} is ready
            </p>
            <p
              style={{
                fontSize: 11,
                marginTop: 6,
                color: 'var(--vel-text-disabled)',
              }}
            >
              {model?.description}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent:
                msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {msg.role === 'user' ? (
              <div
                style={{
                  background: 'var(--vel-bg-elevated)',
                  border: '1px solid var(--vel-border-subtle)',
                  borderRadius: '12px 12px 2px 12px',
                  padding: '8px 12px',
                  maxWidth: '85%',
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                {msg.content}
              </div>
            ) : (
              <div
                style={{
                  maxWidth: '95%',
                  fontSize: 13,
                  lineHeight: 1.7,
                }}
              >
                {msg.content === '' && isStreaming ? (
                  <div
                    style={{
                      display: 'flex',
                      gap: 4,
                      padding: '6px 0',
                      alignItems: 'center',
                    }}
                  >
                    {[0, 1, 2].map((j) => (
                      <div
                        key={j}
                        className="streaming-dot"
                        style={{
                          background: modelColor,
                          animationDelay: `${j * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="nodrag"
        style={{
          borderTop: '1px solid var(--vel-border-subtle)',
          padding: '10px 12px',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${model?.name}...`}
          rows={1}
          disabled={isStreaming}
          style={{
            flex: 1,
            background: 'var(--vel-bg-elevated)',
            border: '1px solid var(--vel-border-subtle)',
            borderRadius: 8,
            padding: '8px 12px',
            color: 'var(--vel-text-primary)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            resize: 'none',
            outline: 'none',
            maxHeight: 100,
            minHeight: 36,
          }}
          onInput={(e) => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = 'auto';
            t.style.height = Math.min(t.scrollHeight, 100) + 'px';
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isStreaming}
          className="btn-primary"
          style={{
            width: 36,
            height: 36,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            flexShrink: 0,
            opacity: !input.trim() || isStreaming ? 0.4 : 1,
            fontSize: 16,
          }}
        >
          {isStreaming ? '◼' : '↑'}
        </button>
      </div>
    </div>
  );
}

export const AIChatTileNode = memo(AIChatTile);
