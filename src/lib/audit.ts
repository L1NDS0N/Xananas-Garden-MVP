import { prisma } from './prisma';
import { v4 as uuid } from 'uuid';

export interface AuditEntry {
  action: 'create' | 'update' | 'delete';
  entity: string;
  entityId?: string;
  changes?: Record<string, any>;
  userId?: string;
  userName?: string;
}

/**
 * Log an audit event.
 * Call this after successful write operations.
 */
export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId || null,
        changes: entry.changes ? JSON.stringify(entry.changes) : null,
        userId: entry.userId || null,
        userName: entry.userName || null,
      },
    });
  } catch (err) {
    // Never let audit logging break the main operation
    console.error('Audit log error:', err);
  }
}

/**
 * Calculate changes between old and new data
 */
export function diffChanges(oldData: Record<string, any>, newData: Record<string, any>): Record<string, { old: any; new: any }> {
  const changes: Record<string, { old: any; new: any }> = {};
  for (const key of Object.keys(newData)) {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changes[key] = { old: oldData[key], new: newData[key] };
    }
  }
  return changes;
}
