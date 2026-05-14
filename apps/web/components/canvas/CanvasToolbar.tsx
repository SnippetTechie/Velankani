'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCanvasStore } from '@/lib/stores/canvas.store';
import { useModelPreferencesStore } from '@/lib/stores/model-preferences.store';
import { v4 as uuidv4 } from 'uuid';
import { getAvailableModels } from '@vel-ai/shared/types/models';
import { getAvailableTiles } from '@vel-ai/shared/types/tiles';

interface CanvasToolbarProps {
  workspaceId: string;
  allowedModelIds?: string[];
}

export function CanvasToolbar({ workspaceId, allowedModelIds }: CanvasToolbarProps) {
  const [showPicker, setShowPicker] = useState(false);
  const { addNode } = useCanvasStore();
  const enabledModelIds = useModelPreferencesStore((state) => state.enabledModelIds);

  const addTile = (
    type: string,
    modelId?: string,
    label?: string,
  ) => {
    const id = uuidv4();
    const position = {
      x: 100 + Math.random() * 400,
      y: 100 + Math.random() * 200,
    };

    addNode({
      id,
      type,
      position,
      data: {
        model: modelId || 'claude-sonnet-4',
        label: label || type,
        workspaceId,
        contextSources: [],
      },
    });

    setShowPicker(false);
  };

  const allModels = getAvailableModels();
  const scopedModels =
    allowedModelIds && allowedModelIds.length > 0
      ? allModels.filter((model) => allowedModelIds.includes(model.id))
      : allModels;
  const models =
    enabledModelIds.length > 0
      ? scopedModels.filter((model) => enabledModelIds.includes(model.id))
      : scopedModels;
  const tiles = getAvailableTiles();

  return (
    <div style={{ position: 'relative' }}>
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              bottom: 56,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--vel-bg-surface)',
              border: '1px solid var(--vel-border-default)',
              borderRadius: 14,
              padding: 16,
              width: 380,
              maxHeight: 420,
              overflowY: 'auto',
              boxShadow: 'var(--shadow-modal)',
              zIndex: 50,
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: 'var(--vel-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              AI Models
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 6,
                marginBottom: 16,
              }}
            >
              {models.slice(0, 8).map((model) => (
                <button
                  key={model.id}
                  onClick={() =>
                    addTile('ai-chat', model.id, model.name)
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    background: 'transparent',
                    border: '1px solid var(--vel-border-subtle)',
                    borderRadius: 8,
                    color: 'var(--vel-text-primary)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontFamily: 'DM Sans, sans-serif',
                    textAlign: 'left',
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.borderColor =
                      model.color + '60';
                    (e.target as HTMLElement).style.background =
                      model.color + '10';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.borderColor = '';
                    (e.target as HTMLElement).style.background = '';
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: model.color,
                      flexShrink: 0,
                    }}
                  />
                  <span>{model.name}</span>
                </button>
              ))}
            </div>

            <p
              style={{
                fontSize: 11,
                color: 'var(--vel-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              Specialized Tiles
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 6,
              }}
            >
              {tiles
                .filter((t) => t.type !== 'ai-chat')
                .map((tile) => (
                  <button
                    key={tile.type}
                    onClick={() => addTile(tile.type, undefined, tile.label)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      background: 'transparent',
                      border: '1px solid var(--vel-border-subtle)',
                      borderRadius: 8,
                      color: 'var(--vel-text-primary)',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontFamily: 'DM Sans, sans-serif',
                      textAlign: 'left',
                      transition: 'all 150ms',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.borderColor =
                        tile.color + '60';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.borderColor = '';
                    }}
                  >
                    <span>{tile.icon}</span>
                    <span>{tile.label}</span>
                  </button>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <motion.div
        className="vel-glass"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '6px 8px',
          borderRadius: 12,
          boxShadow: 'var(--shadow-tile)',
        }}
      >
        <button
          onClick={() => setShowPicker(!showPicker)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: showPicker ? 'var(--vel-accent)' : 'transparent',
            border: 'none',
            borderRadius: 8,
            color: showPicker
              ? 'white'
              : 'var(--vel-text-secondary)',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 500,
            transition: 'all 150ms',
          }}
        >
          <span style={{ fontSize: 16 }}>+</span>
          Add Tile
        </button>

        <div
          style={{
            width: 1,
            height: 24,
            background: 'var(--vel-border-subtle)',
            margin: '0 4px',
          }}
        />

        <button
          onClick={() => addTile('consensus', undefined, 'Consensus')}
          title="Quick add Consensus tile"
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: 8,
            color: 'var(--vel-text-secondary)',
            cursor: 'pointer',
            fontSize: 16,
            transition: 'all 150ms',
          }}
        >
          ⚡
        </button>

        <button
          onClick={() => addTile('research', undefined, 'Research')}
          title="Quick add Research tile"
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: 8,
            color: 'var(--vel-text-secondary)',
            cursor: 'pointer',
            fontSize: 16,
            transition: 'all 150ms',
          }}
        >
          🔍
        </button>
      </motion.div>
    </div>
  );
}
