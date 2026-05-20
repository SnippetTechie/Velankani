// ═══════════════════════════════════════════════════════════
// VEL AI — Workspace Service
// ═══════════════════════════════════════════════════════════

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { db } from '../../database/db';
import { workspaces } from '../../database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);

  async findAllByUser(userId: string) {
    const result = await db.execute(sql`
      SELECT * FROM workspaces WHERE user_id = ${userId} ORDER BY last_opened_at DESC NULLS LAST
    `);
    return Array.isArray(result) ? result : [];
  }

  async findById(id: string, userId: string) {
    const result = await db.execute(sql`
      SELECT * FROM workspaces WHERE id = ${id} AND user_id = ${userId}
    `);
    const rows = Array.isArray(result) ? result : [];

    if (rows.length === 0) {
      throw new NotFoundException('Workspace not found');
    }

    await db.execute(sql`UPDATE workspaces SET last_opened_at = NOW() WHERE id = ${id}`);

    return rows[0];
  }

  async create(
    userId: string,
    data: { name: string; description?: string; templateId?: string },
  ) {
    const shareToken = uuidv4().replace(/-/g, '').slice(0, 16);
    const name = data.name || 'Untitled Workspace';
    const description = data.description || null;
    const templateId = data.templateId || null;

    const result = await db.execute(sql`
      INSERT INTO workspaces (user_id, name, description, template_id, share_token, canvas_state, context_graph, tile_count)
      VALUES (${userId}, ${name}, ${description}, ${templateId}, ${shareToken}, '{"nodes": [], "edges": [], "viewport": {"x": 0, "y": 0, "zoom": 0.85}}', '{"connections": []}', 0)
      RETURNING *
    `);

    return result[0];
  }

  async update(
    id: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      canvasState?: unknown;
      contextGraph?: unknown;
      tileCount?: number;
    },
  ) {
    const setData: Record<string, unknown> = {};
    if (data.name !== undefined) setData.name = data.name;
    if (data.description !== undefined) setData.description = data.description;
    if (data.canvasState !== undefined) setData.canvasState = JSON.stringify(data.canvasState);
    if (data.contextGraph !== undefined) setData.contextGraph = JSON.stringify(data.contextGraph);
    if (data.tileCount !== undefined) setData.tileCount = data.tileCount;

    if (Object.keys(setData).length === 0) {
      return this.findById(id, userId);
    }

    const [workspace] = await db
      .update(workspaces)
      .set(setData)
      .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)))
      .returning();

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async delete(id: string, userId: string) {
    const result = await db.execute(sql`
      DELETE FROM workspaces WHERE id = ${id} AND user_id = ${userId} RETURNING *
    `);
    const rows = Array.isArray(result) ? result : [];
    if (rows.length === 0) {
      throw new NotFoundException('Workspace not found');
    }

    return { deleted: true };
  }

  async findByShareToken(shareToken: string) {
    const result = await db.execute(sql`
      SELECT * FROM workspaces WHERE share_token = ${shareToken} AND is_public = true
    `);
    const rows = Array.isArray(result) ? result : [];
    return rows[0] || null;
  }

  async verifyOwnership(workspaceId: string, userId: string): Promise<boolean> {
    try {
      // Skip verification for non-UUID workspace IDs (e.g., "testing", "new")
      // These are temporary/client-side workspaces that haven't been persisted yet
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(workspaceId)) {
        return true; // Allow access to non-persisted workspaces
      }

      const [row] = await db
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, userId)));
      return !!row;
    } catch (error) {
      this.logger.error(`verifyOwnership error: ${error}`);
      return false;
    }
  }
}
