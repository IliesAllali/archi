import type { Server } from 'socket.io'

/**
 * Singleton accessor for the Socket.IO server instance.
 * The instance is created in server.js and stored on `global._io`.
 * API routes use getIO() to emit events to connected clients.
 */
export function getIO(): Server {
  const io = (global as any)._io as Server | undefined
  if (!io) {
    // In dev, Next.js sometimes hot-reloads before server.js sets up IO.
    // Returning a no-op stub prevents crashes.
    return createNoopIO()
  }
  return io
}

/** Emit an event to all users watching a specific project */
export function emitToProject(projectId: string, event: string, data: unknown): void {
  try {
    getIO().to(`project:${projectId}`).emit(event, data)
  } catch {
    // Silently ignore if Socket.IO is not available
  }
}

function createNoopIO(): any {
  const noop = () => noopRoom
  const noopRoom = { emit: noop, to: noop }
  return { to: noop, emit: noop }
}
