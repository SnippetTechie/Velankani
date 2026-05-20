'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  Bot,
  CirclePlus,
  FolderOpen,
  Globe,
  Image as ImageIcon,
  Mic,
  Plus,
  Search,
  Settings2,
  SunMedium,
  StopCircle,
  Paperclip,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getAvailableModels, getModel, type AIModel } from '@vel-ai/shared/types/models';
import { useWorkspaceStore } from '@/lib/stores/workspace.store';
import { useCreditStore } from '@/lib/stores/credits.store';
import { useModelPreferencesStore } from '@/lib/stores/model-preferences.store';
import { CreateProjectModal } from '@/components/workspace/CreateProjectModal';
import { ModelPreferencesModal } from '@/components/workspace/ModelPreferencesModal';
import { NewWorkspaceModal } from '@/components/workspace/NewWorkspaceModal';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface ModelResponse {
  modelId: string;
  modelName: string;
  modelColor: string;
  content: string;
  status: 'streaming' | 'done' | 'error';
  error?: string;
}

export default function WorkspacePage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const { setCurrentWorkspace } = useWorkspaceStore();
  const { balance } = useCreditStore();
  const { enabledModelIds } = useModelPreferencesStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showModelPreferences, setShowModelPreferences] = useState(false);

  const [input, setInput] = useState('');
  const [modelResponses, setModelResponses] = useState<ModelResponse[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());
  const [allDone, setAllDone] = useState(false);
  const { getToken } = useAuth();

  // Resolved workspace UUID from the backend
  const [resolvedWorkspaceId, setResolvedWorkspaceId] = useState<string | null>(null);
  const [resolvedTileId, setResolvedTileId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const abortControllersRef = useRef<AbortController[]>([]);

  // Auto-create workspace and tile on page load
  useEffect(() => {
    const initWorkspace = async () => {
      const token = await getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      try {
        // First check if user already has workspaces
        const listRes = await fetch(`${API_BASE}/workspaces`, {
          headers,
          credentials: 'include',
        });

        if (listRes.ok) {
          const existingWorkspaces = await listRes.json();
          // Look for a workspace matching this slug name
          const wsName = workspaceId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          const existing = existingWorkspaces.find((ws: any) => ws.name === wsName);

          if (existing) {
            setResolvedWorkspaceId(existing.id);
            setCurrentWorkspace(existing.id, existing.name);

            // Get existing tiles for this workspace
            const tilesRes = await fetch(`${API_BASE}/tiles/workspace/${existing.id}`, {
              headers,
              credentials: 'include',
            });
            if (tilesRes.ok) {
              const existingTiles = await tilesRes.json();
              if (existingTiles.length > 0) {
                setResolvedTileId(existingTiles[0].id);
                return;
              }
            }

            // Create a tile if none exist
            const tileRes = await fetch(`${API_BASE}/tiles`, {
              method: 'POST',
              headers,
              credentials: 'include',
              body: JSON.stringify({
                workspaceId: existing.id,
                reactFlowId: `tile-${Date.now()}`,
                tileType: 'ai-chat',
                label: 'Multi-Model Chat',
                positionX: 0,
                positionY: 0,
              }),
            });
            if (tileRes.ok) {
              const tile = await tileRes.json();
              setResolvedTileId(tile.id);
            }
            return;
          }
        }

        // No existing workspace found — create one
        const wsName = workspaceId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const res = await fetch(`${API_BASE}/workspaces`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ name: wsName }),
        });
        if (res.ok) {
          const ws = await res.json();
          setResolvedWorkspaceId(ws.id);
          setCurrentWorkspace(ws.id, ws.name);

          // Create a default tile for this workspace
          const tileRes = await fetch(`${API_BASE}/tiles`, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify({
              workspaceId: ws.id,
              reactFlowId: `tile-${Date.now()}`,
              tileType: 'ai-chat',
              label: 'Multi-Model Chat',
              positionX: 0,
              positionY: 0,
            }),
          });
          if (tileRes.ok) {
            const tile = await tileRes.json();
            setResolvedTileId(tile.id);
          }
        } else {
          setCurrentWorkspace(workspaceId, 'Workspace');
        }
      } catch {
        setCurrentWorkspace(workspaceId, 'Workspace');
      }
    };

    initWorkspace();
  }, [workspaceId, getToken, setCurrentWorkspace]);

  const allModels = useMemo(() => getAvailableModels(), []);
  const models = allModels; // passed to ModelPreferencesModal

  const selectedModels = useMemo(() => {
    if (enabledModelIds.length === 0) {
      const defaultModels = allModels.filter((m) =>
        ['gpt-4o', 'claude-sonnet-4', 'gemini-2-flash'].includes(m.id),
      );
      return defaultModels.slice(0, 3);
    }
    return enabledModelIds
      .map((id) => getModel(id))
      .filter((m): m is AIModel => m !== undefined);
  }, [enabledModelIds, allModels]);

  useEffect(() => {
    setExpandedModels(new Set(allDone ? selectedModels.map((m) => m.id) : []));
  }, [allDone, selectedModels]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text && attachedFiles.length === 0) return;
    if (isStreaming) return;

    const userMessage = text;
    setInput('');
    setIsStreaming(true);
    setAllDone(false);
    setStatusText('');

    const modelsToUse = selectedModels.length > 0 ? selectedModels : allModels.slice(0, 3);
    abortControllersRef.current = [];

    const initialResponses: ModelResponse[] = modelsToUse.map((m) => ({
      modelId: m.id,
      modelName: m.name,
      modelColor: m.color,
      content: '',
      status: 'streaming' as const,
    }));
    setModelResponses(initialResponses);
    setExpandedModels(new Set(modelsToUse.map((m) => m.id)));

    let completedCount = 0;

    const attachedContext =
      attachedFiles.length > 0
        ? `\n\n[Attached files: ${attachedFiles.map((f) => f.name).join(', ')}]`
        : '';

    const systemMessage = webSearchEnabled
      ? { role: 'system' as const, content: 'You have web search available. Provide up-to-date information.' }
      : null;

    const messages = [
      ...(systemMessage ? [systemMessage] : []),
      { role: 'user' as const, content: userMessage + attachedContext },
    ];

    const token = await getToken();
    const effectiveWorkspaceId = resolvedWorkspaceId || workspaceId;
    const effectiveTileId = resolvedTileId || 'multi-model';

    // Save user message to backend
    if (resolvedTileId) {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          tileId: resolvedTileId,
          role: 'user',
          content: userMessage + attachedContext,
        }),
      }).catch(() => {}); // fire-and-forget
    }

    modelsToUse.forEach((model, index) => {
      const controller = new AbortController();
      abortControllersRef.current.push(controller);

      const streamModel = async () => {
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const response = await fetch(`${API_BASE}/ai/stream`, {
            method: 'POST',
            headers,
            credentials: 'include',
            signal: controller.signal,
            body: JSON.stringify({
              model: model.id,
              messages,
              tileId: effectiveTileId,
              tileType: 'ai-chat',
              workspaceId: effectiveWorkspaceId,
              contextSources: webSearchEnabled ? ['web-search'] : [],
              maxTokens: 4096,
              requestId: `${model.id}-${Date.now()}`,
            }),
          });

          if (!response.ok) {
            const errText = await response.text().catch(() => '');
            setModelResponses((prev) => {
              const updated = [...prev];
              updated[index] = { ...updated[index], status: 'error', error: errText || `HTTP ${response.status}` };
              return updated;
            });
            completedCount++;
            if (completedCount === modelsToUse.length) {
              setIsStreaming(false);
              setAllDone(true);
            }
            return;
          }

          const reader = response.body?.getReader();
          if (!reader) {
            setModelResponses((prev) => {
              const updated = [...prev];
              updated[index] = { ...updated[index], status: 'error', error: 'No response stream' };
              return updated;
            });
            completedCount++;
            if (completedCount === modelsToUse.length) {
              setIsStreaming(false);
              setAllDone(true);
            }
            return;
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data: ')) continue;

              try {
                const data = JSON.parse(trimmed.slice(6));
                if (data.type === 'delta' && data.content) {
                  setModelResponses((prev) => {
                    const updated = [...prev];
                    updated[index] = { ...updated[index], content: updated[index].content + data.content };
                    return updated;
                  });
                } else if (data.type === 'error') {
                  setModelResponses((prev) => {
                    const updated = [...prev];
                    updated[index] = { ...updated[index], status: 'error', error: data.message };
                    return updated;
                  });
                } else if (data.type === 'done') {
                  setModelResponses((prev) => {
                    const updated = [...prev];
                    updated[index] = { ...updated[index], status: 'done' };
                    return updated;
                  });
                }
              } catch {
                // skip malformed
              }
            }
          }

          setModelResponses((prev) => {
            const updated = [...prev];
            if (updated[index].status === 'streaming') {
              updated[index] = { ...updated[index], status: 'done' };
            }
            return updated;
          });
        } catch (err: unknown) {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          setModelResponses((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], status: 'error', error: err instanceof Error ? err.message : 'Stream failed' };
            return updated;
          });
        } finally {
          completedCount++;

          // Save assistant message to backend after streaming completes
          if (resolvedTileId) {
            setModelResponses((prev) => {
              const resp = prev[index];
              if (resp && resp.content && resp.status === 'done') {
                const saveHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
                if (token) saveHeaders['Authorization'] = `Bearer ${token}`;
                fetch(`${API_BASE}/messages`, {
                  method: 'POST',
                  headers: saveHeaders,
                  credentials: 'include',
                  body: JSON.stringify({
                    tileId: resolvedTileId,
                    role: 'assistant',
                    content: resp.content,
                    model: model.id,
                  }),
                }).catch(() => {});
              }
              return prev;
            });
          }

          if (completedCount === modelsToUse.length) {
            setIsStreaming(false);
            setAllDone(true);
            setAttachedFiles([]);
          }
        }
      };

      streamModel();
    });
  }, [input, attachedFiles, isStreaming, selectedModels, allModels, workspaceId, webSearchEnabled, resolvedWorkspaceId, resolvedTileId, getToken]);

  const stopAll = () => {
    abortControllersRef.current.forEach((c) => c.abort());
    abortControllersRef.current = [];
    setIsStreaming(false);
    setStatusText('Stopped');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles((prev) => [...prev, ...files]);
    if (e.target) e.target.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const startVoiceRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatusText('Voice recording not supported');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 24000,
      });
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        if (audioBlob.size < 100) {
          setIsRecording(false);
          setStatusText('');
          return;
        }
        setIsRecording(false);
        setStatusText('Transcribing...');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
          const token = await getToken();
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          const res = await fetch(`${API_BASE}/voice/stt`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
            signal: controller.signal,
          });
          clearTimeout(timeout);
          const data = await res.json();
          if (data.transcript) {
            setInput((prev) => (prev ? `${prev} ${data.transcript}` : data.transcript));
            setStatusText('');
          } else if (data.error) {
            setStatusText('');
          }
        } catch {
          clearTimeout(timeout);
          setStatusText('');
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatusText('Recording...');
    } catch {
      setStatusText('Microphone access denied');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const toggleVoice = () => {
    if (isRecording) stopVoiceRecording();
    else startVoiceRecording();
  };

  const toggleExpand = (modelId: string) => {
    setExpandedModels((prev) => {
      const next = new Set(prev);
      if (next.has(modelId)) next.delete(modelId);
      else next.add(modelId);
      return next;
    });
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'streaming': return <Loader2 className="h-3 w-3 animate-spin text-violet-400" />;
      case 'done': return <span className="h-3 w-3 rounded-full bg-green-500" />;
      case 'error': return <span className="h-3 w-3 rounded-full bg-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-transparent text-[var(--vel-text)]" style={{ backgroundImage: 'url(/bg-workspace.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <aside className="hidden w-72 shrink-0 border-r border-[var(--vel-border-subtle)] bg-[var(--vel-surface)]/90 px-4 py-4 lg:flex lg:flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="VEL AI logo" width={28} height={28} />
            <span className="font-display text-lg font-bold tracking-tight">VEL AI</span>
          </div>
          <button className="rounded-md p-1 text-[var(--vel-text-secondary)] transition-colors hover:bg-[var(--vel-card)] hover:text-[var(--vel-text)]">
            <SunMedium className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--vel-text-muted)]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="h-9 w-full rounded-md border border-[var(--vel-border)] bg-[var(--vel-card)] pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-[var(--vel-text-muted)] focus:border-[var(--vel-border-focus)]"
            />
          </label>
        </div>

        <div className="mt-3 space-y-1">
          <button
            onClick={() => { setInput(''); setModelResponses([]); setAllDone(false); }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-[var(--vel-card)]"
          >
            <CirclePlus className="h-4 w-4 text-[var(--vel-violet)]" />
            New Chat
          </button>
          <button
            onClick={() => setShowNewWorkspaceModal(true)}
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--vel-card)]"
          >
            <span className="inline-flex items-center gap-2">
              <Bot className="h-4 w-4 text-[var(--vel-violet)]" /> Workspace
            </span>
            <Plus className="h-4 w-4 text-[var(--vel-text-muted)]" />
          </button>
          <button
            onClick={() => setShowCreateProjectModal(true)}
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--vel-card)]"
          >
            <span className="inline-flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-[var(--vel-violet)]" /> Projects
            </span>
            <Plus className="h-4 w-4 text-[var(--vel-text-muted)]" />
          </button>
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--vel-card)]">
            <ImageIcon className="h-4 w-4 text-[var(--vel-violet)]" /> Image Studio
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-[var(--vel-border)] bg-[var(--vel-card)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--vel-text-muted)]">Workspace Controls</p>
          <button
            onClick={() => setShowModelPreferences(true)}
            className="mt-2 inline-flex items-center gap-2 rounded-md border border-[var(--vel-border)] bg-[var(--vel-overlay)] px-3 py-2 text-xs font-medium text-[var(--vel-text-secondary)] transition-colors hover:border-[var(--vel-border-focus)] hover:text-[var(--vel-text)]"
          >
            <Settings2 className="h-4 w-4" />
            Model Preferences
          </button>
        </div>

        <div className="mt-auto space-y-3">
          <div className="rounded-lg border border-[var(--vel-border)] bg-[var(--vel-card)] p-3">
            <p className="text-sm font-semibold">Active Models</p>
            <div className="mt-2 space-y-1">
              {selectedModels.map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-xs text-[var(--vel-text-secondary)]">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
                  {m.name}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[var(--vel-border)] bg-[var(--vel-card)] p-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--vel-overlay)] text-xs font-semibold">S</span>
            <div>
              <p className="text-sm font-medium">Somesh</p>
              <p className="text-xs text-[var(--vel-text-secondary)]">Personal Workspace</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="border-b border-[var(--vel-border-subtle)] px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-lg font-semibold tracking-tight">Workspace</h1>
            <button
              onClick={() => setShowModelPreferences(true)}
              className="inline-flex items-center gap-2 rounded-md border border-[var(--vel-border)] bg-[var(--vel-card)] px-3 py-2 text-xs text-[var(--vel-text-secondary)] transition-colors hover:text-[var(--vel-text)]"
            >
              <Settings2 className="h-4 w-4" />
              Models ({selectedModels.length})
            </button>
          </div>
        </div>

        <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-4 sm:px-6">
          {modelResponses.length > 0 && (
            <div className="mb-4 flex-1 space-y-3 overflow-y-auto">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {modelResponses.map((response, i) => {
                  const isExpanded = expandedModels.has(response.modelId);
                  const preview = response.content.slice(0, 200);

                  return (
                    <div
                      key={response.modelId}
                      className={`rounded-xl border transition-all ${
                        response.status === 'error'
                          ? 'border-red-500/40 bg-red-500/5'
                          : response.status === 'done'
                          ? 'border-green-500/20 bg-[var(--vel-card)]'
                          : 'border-[var(--vel-border)] bg-[var(--vel-card)]'
                      }`}
                    >
                      <div
                        className="flex cursor-pointer items-center justify-between border-b border-[var(--vel-border-subtle)] px-3 py-2"
                        onClick={() => toggleExpand(response.modelId)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: response.modelColor }} />
                          <span className="text-sm font-semibold">{response.modelName}</span>
                          <span className="ml-1">{statusIcon(response.status)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {response.status === 'streaming' && (
                            <span className="text-[10px] text-violet-400">streaming</span>
                          )}
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </div>
                      </div>
                      <div className="px-3 py-2">
                        {response.status === 'error' ? (
                          <p className="text-xs text-red-400">{response.error || 'Request failed'}</p>
                        ) : isExpanded ? (
                          <div className="max-h-96 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-[var(--vel-text)]">
                            {response.content || (
                              <span className="text-[var(--vel-text-muted)] italic">Waiting for response...</span>
                            )}
                          </div>
                        ) : (
                          <p className="truncate text-xs text-[var(--vel-text-secondary)]">
                            {preview || 'Waiting...'}
                            {response.content.length > 200 ? '...' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {statusText && (
            <p className="mb-2 text-center text-xs text-[var(--vel-text-secondary)]">{statusText}</p>
          )}

          {attachedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachedFiles.map((file, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-md border border-[var(--vel-border)] bg-[var(--vel-card)] px-2 py-1 text-xs"
                >
                  <Paperclip className="h-3 w-3" />
                  {file.name}
                  <button onClick={() => removeFile(i)} className="ml-1 text-[var(--vel-text-muted)] hover:text-red-400">&times;</button>
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto rounded-2xl border border-[var(--vel-border)] bg-[var(--vel-card)] p-4 sm:p-5">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything... (Enter to send, Shift+Enter for newline)"
              disabled={isStreaming}
              className="h-28 w-full resize-none border-none bg-transparent text-sm outline-none placeholder:text-[var(--vel-text-muted)] disabled:opacity-50"
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--vel-border-subtle)] pt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUploadClick}
                  disabled={isStreaming}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--vel-border)] bg-[var(--vel-overlay)] px-3 text-xs text-[var(--vel-text-secondary)] transition-colors hover:text-[var(--vel-text)] disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" /> Upload
                </button>
                <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />
                <button
                  onClick={toggleVoice}
                  disabled={isStreaming}
                  className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs transition-colors disabled:opacity-50 ${
                    isRecording
                      ? 'border-red-500 bg-red-500/20 text-red-400'
                      : 'border-[var(--vel-border)] bg-[var(--vel-overlay)] text-[var(--vel-text-secondary)] hover:text-[var(--vel-text)]'
                  }`}
                >
                  {isRecording ? <StopCircle className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {isRecording ? 'Stop' : 'Voice'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                  className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs transition-colors ${
                    webSearchEnabled
                      ? 'border-violet-500 bg-violet-500/20 text-violet-400'
                      : 'border-[var(--vel-border)] bg-[var(--vel-overlay)] text-[var(--vel-text-secondary)] hover:text-[var(--vel-text)]'
                  }`}
                >
                  <Globe className="h-4 w-4" />
                  {webSearchEnabled ? 'Search On' : 'Web Search'}
                </button>
                {isStreaming ? (
                  <button
                    onClick={stopAll}
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-red-600 px-4 text-xs font-medium text-white transition-colors hover:bg-red-500"
                  >
                    <StopCircle className="h-4 w-4" /> Stop All
                  </button>
                ) : (
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() && attachedFiles.length === 0}
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-violet-600 px-4 text-xs font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
                  >
                    Send
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <NewWorkspaceModal open={showNewWorkspaceModal} onClose={() => setShowNewWorkspaceModal(false)} />
      <CreateProjectModal open={showCreateProjectModal} onClose={() => setShowCreateProjectModal(false)} />
      <ModelPreferencesModal
        open={showModelPreferences}
        onClose={() => setShowModelPreferences(false)}
        models={models}
      />
    </div>
  );
}