import type { AuditLog, AuditActionType } from '../types/audit';

/**
 * Creates a new audit log entry object
 */
export function createAuditLogEntry(
  actorId: string,
  actorEmail: string,
  actionType: AuditActionType,
  targetType: AuditLog['targetType'],
  targetId?: string,
  targetName?: string,
  details?: Record<string, any>
): Omit<AuditLog, 'id' | 'timestamp' | 'ipAddress' | 'userAgent'> {
  return {
    actorId: actorId,
    actorEmail: actorEmail,
    actionType: actionType,
    targetType: targetType,
    targetId: targetId,
    targetName: targetName,
    details: details || {}
  };
}

/**
 * Formats an audit log entry for display
 */
export function formatAuditLogAction(log: AuditLog): string {
  const action = log.actionType.replace(/_/g, ' ');
  const target = log.targetName || log.targetId || log.targetType;
  
  return `${action} ${log.targetType} ${target}`;
}

/**
 * Returns a human-readable timestamp from an ISO date string
 */
export function formatAuditTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
