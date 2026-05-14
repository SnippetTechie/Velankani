'use client';

import { useCallback } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  MiniMap,
  ConnectionMode,
  Panel,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useCanvasStore } from '@/lib/stores/canvas.store';
import { ContextEdge } from './ContextEdge';
import { CanvasToolbar } from './CanvasToolbar';
import { AIChatTileNode } from '@/components/tiles/AIChatTile';
import { ConsensusTileNode } from '@/components/tiles/ConsensusTile';
import { ResearchTileNode } from '@/components/tiles/ResearchTile';

const nodeTypes: NodeTypes = {
  'ai-chat': AIChatTileNode,
  'consensus': ConsensusTileNode,
  'research': ResearchTileNode,
};

const edgeTypes = {
  context: ContextEdge,
};

interface InfiniteCanvasProps {
  workspaceId: string;
  allowedModelIds?: string[];
}

function InfiniteCanvas({ workspaceId, allowedModelIds }: InfiniteCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, addEdge } =
    useCanvasStore();

  const onConnect = useCallback(
    (connection: Connection) => {
      addEdge({
        ...connection,
        id: `e-${connection.source}-${connection.target}`,
        type: 'context',
        animated: true,
        style: {
          stroke: 'rgba(109, 95, 255, 0.6)',
          strokeWidth: 1.5,
        },
        data: { label: 'Context', active: false },
      } as Edge);
    },
    [addEdge],
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        panOnDrag={[1, 2]}
        panOnScroll={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
        minZoom={0.1}
        maxZoom={2.0}
        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
        deleteKeyCode={['Delete', 'Backspace']}
        fitView={false}
        style={{ background: 'transparent' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255, 255, 255, 0.035)"
        />

        <MiniMap
          style={{
            background: 'rgba(12, 12, 16, 0.9)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8,
          }}
          nodeColor={(node) => {
            const colors: Record<string, string> = {
              'ai-chat': '#8B5CF6',
              'consensus': '#6D5FFF',
              'terminal': '#22C55E',
              'research': '#14B8A6',
              'docs': '#3B82F6',
              'cadam': '#F59E0B',
            };
            return colors[node.type || ''] || '#4A4A5A';
          }}
          maskColor="rgba(5, 5, 7, 0.6)"
        />

        <Panel position="bottom-center">
          <CanvasToolbar workspaceId={workspaceId} allowedModelIds={allowedModelIds} />
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function InfiniteCanvasProvider({
  workspaceId,
  allowedModelIds,
}: InfiniteCanvasProps) {
  return (
    <ReactFlowProvider>
      <InfiniteCanvas workspaceId={workspaceId} allowedModelIds={allowedModelIds} />
    </ReactFlowProvider>
  );
}
