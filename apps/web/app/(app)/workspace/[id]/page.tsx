'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { UserButton, useAuth } from '@clerk/nextjs';
import { InfiniteCanvasProvider } from '@/components/canvas/InfiniteCanvas';
import { ModelPreferencesModal } from '@/components/workspace/ModelPreferencesModal';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';
import { useCreditStore } from '@/lib/stores/credits.store';
import { useActivityStore } from '@/lib/stores/activity.store';
import { useModelPreferencesStore } from '@/lib/stores/model-preferences.store';
import { getAvailableModels, getModelsForPlan } from '@vel-ai/shared/types/models';
import Link from 'next/link';

export default function WorkspacePage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const { getToken } = useAuth();
  const { setCurrentWorkspace, workspaceName, isSaving, lastSaved } =
    useWorkspaceStore();
  const { balance } = useCreditStore();
  const { events } = useActivityStore();
  const [showModelPreferences, setShowModelPreferences] = useState(false);
  const [allowedModelIds, setAllowedModelIds] = useState<string[]>([]);
  const setAllowedIdsInStore = useModelPreferencesStore((state) => state.setAllowedModelIds);
  const hasHydratedPreferences = useModelPreferencesStore((state) => state.hasHydrated);

  useEffect(() => {
    setCurrentWorkspace(workspaceId, 'My Workspace');
  }, [workspaceId, setCurrentWorkspace]);

  useEffect(() => {
    let active = true;

    const loadAllowedModels = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/users/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
          },
        );

        if (!response.ok) throw new Error('Failed to load user plan');
        const user = (await response.json()) as { plan?: string };
        const models = getModelsForPlan(user.plan || 'free');
        const ids = models.map((model) => model.id);

        if (!active) return;
        setAllowedModelIds(ids);
        setAllowedIdsInStore(ids);
      } catch {
        const fallback = getModelsForPlan('free').map((model) => model.id);
        if (!active) return;
        setAllowedModelIds(fallback);
        setAllowedIdsInStore(fallback);
      }
    };

    void loadAllowedModels();
    return () => {
      active = false;
    };
  }, [getToken, setAllowedIdsInStore]);

  useEffect(() => {
    if (!hasHydratedPreferences) return;
    const seen = window.localStorage.getItem('vel-model-preferences-seen-v1');
    if (seen) return;

    setShowModelPreferences(true);
    window.localStorage.setItem('vel-model-preferences-seen-v1', '1');
  }, [hasHydratedPreferences]);

  const creditStatus =
    balance > 50 ? 'credit-ok' : balance > 15 ? 'credit-warn' : 'credit-low';
  const modalModels = useMemo(() => {
    const all = getAvailableModels();
    if (allowedModelIds.length === 0) return all;
    return all.filter((model) => allowedModelIds.includes(model.id));
  }, [allowedModelIds]);

  return (
    <div
      style={{
        height: '100vh',
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        background: 'transparent',
      }}
    >
      <aside
        style={{
          borderRight: '1px solid var(--vel-border-subtle)',
          background: 'var(--vel-surface)',
          display: 'flex',
          flexDirection: 'column',
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Link
            href="/dashboard"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 44,
              lineHeight: 0.95,
              fontWeight: 700,
              letterSpacing: '-0.04em',
              textDecoration: 'none',
              color: 'var(--vel-text)',
            }}
          >
            VEL
            <span style={{ color: 'var(--vel-violet)' }}>.AI</span>
          </Link>
        </div>

        <div
          style={{
            height: 44,
            borderRadius: 12,
            border: '1px solid var(--vel-border-subtle)',
            background: 'var(--vel-card)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 14px',
            color: 'var(--vel-text-secondary)',
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          Search
        </div>

        <button className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 12px', marginBottom: 8 }}>
          + New chat
        </button>
        <button className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 12px' }}>
          Image Studio
        </button>

        <div style={{ marginTop: 24, color: 'var(--vel-text-muted)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Workspace
        </div>
        <div
          style={{
            marginTop: 10,
            border: '1px solid var(--vel-border-subtle)',
            borderRadius: 10,
            background: 'var(--vel-card)',
            padding: '10px 12px',
            color: 'var(--vel-text-secondary)',
            fontSize: 13,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {workspaceName}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <div
            style={{
              border: '1px solid var(--vel-border-subtle)',
              borderRadius: 12,
              background: 'var(--vel-card)',
              padding: 12,
            }}
          >
            <div style={{ fontSize: 13, color: 'var(--vel-text)', fontWeight: 600 }}>Free Plan</div>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--vel-text-secondary)' }}>
              {balance} credits remaining
            </div>
          </div>
        </div>
      </aside>

      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 20px',
            borderBottom: '1px solid var(--vel-border-subtle)',
            background: 'var(--vel-surface)',
            zIndex: 50,
            height: 56,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--vel-text)' }}>
              {workspaceName}
            </span>

            {isSaving && (
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--vel-text-muted)',
                  fontStyle: 'italic',
                }}
              >
                Saving...
              </span>
            )}
            {lastSaved && !isSaving && (
              <span style={{ fontSize: 11, color: 'var(--vel-text-secondary)' }}>
                Saved
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                background: 'var(--vel-card)',
                border: '1px solid var(--vel-border-subtle)',
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              <span className={creditStatus} style={{ fontWeight: 600 }}>
                {balance}
              </span>
              <span style={{ color: 'var(--vel-text-muted)', fontSize: 10 }}>
                cr
              </span>
            </div>

            {events.length > 0 && (
              <div
                style={{
                  minWidth: 24,
                  height: 24,
                  borderRadius: 12,
                  background: 'var(--vel-violet-alpha-12)',
                  border: '1px solid rgba(98, 179, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  color: 'var(--vel-violet-bright)',
                  fontWeight: 600,
                  padding: '0 7px',
                }}
              >
                {events.length}
              </div>
            )}

            <button
              onClick={() => setShowModelPreferences(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: 30,
                padding: '0 11px',
                borderRadius: 8,
                border: '1px solid var(--vel-border-subtle)',
                background: 'var(--vel-card)',
                color: 'var(--vel-text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.01em',
                cursor: 'pointer',
              }}
            >
              Models
            </button>

            <UserButton
              appearance={{
                elements: { avatarBox: { width: 28, height: 28 } },
              }}
            />
          </div>
        </header>

        <div style={{ flex: 1, minHeight: 0 }}>
          <InfiniteCanvasProvider workspaceId={workspaceId} allowedModelIds={allowedModelIds} />
        </div>
      </div>

      <ModelPreferencesModal
        open={showModelPreferences}
        onClose={() => setShowModelPreferences(false)}
        models={modalModels}
      />
    </div>
  );
}
