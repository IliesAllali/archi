// Custom Node.js server — Next.js + Socket.IO
// Required because Next.js serverless mode doesn't support persistent WebSockets
// Run with: node server.js (dev) or NODE_ENV=production node server.js (prod)

import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server } from 'socket.io'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// In-memory presence store: projectId → Map<socketId, PresenceUser>
const presence = new Map()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error handling request:', err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.BASE_URL || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  // Expose io globally so API routes can emit events
  global._io = io

  // ─── Socket.IO handlers ───────────────────────────────────────────────────

  io.on('connection', (socket) => {
    let currentProjectId = null
    let currentUser = null

    socket.on('join-project', ({ projectId, userId, guestId, displayName, color, role, avatarUrl, isAI }) => {
      // Leave previous room if any
      if (currentProjectId) {
        leaveProject(socket, currentProjectId, currentUser)
      }

      currentProjectId = projectId
      currentUser = {
        id: userId || guestId || socket.id,
        displayName: displayName || 'Visiteur',
        role: role || 'guest',
        color: color || randomColor(),
        avatarUrl: avatarUrl || null,
        activeNodeId: null,
        isAI: isAI || false,
        lastSeen: Date.now(),
      }

      socket.join(`project:${projectId}`)

      // Add to presence map
      if (!presence.has(projectId)) presence.set(projectId, new Map())
      presence.get(projectId).set(socket.id, currentUser)

      // Broadcast updated presence to all in room
      broadcastPresence(io, projectId)
    })

    socket.on('node-focus', ({ projectId, nodeId }) => {
      if (!currentUser || currentProjectId !== projectId) return
      currentUser.activeNodeId = nodeId
      currentUser.lastSeen = Date.now()
      if (presence.has(projectId)) {
        presence.get(projectId).set(socket.id, currentUser)
      }
      socket.to(`project:${projectId}`).emit('node-focused', {
        userId: currentUser.id,
        displayName: currentUser.displayName,
        nodeId,
        color: currentUser.color,
      })
      broadcastPresence(io, projectId)
    })

    socket.on('node-blur', ({ projectId }) => {
      if (!currentUser || currentProjectId !== projectId) return
      currentUser.activeNodeId = null
      currentUser.lastSeen = Date.now()
      if (presence.has(projectId)) {
        presence.get(projectId).set(socket.id, currentUser)
      }
      broadcastPresence(io, projectId)
    })

    socket.on('leave-project', ({ projectId }) => {
      leaveProject(socket, projectId, currentUser)
      currentProjectId = null
      currentUser = null
    })

    socket.on('disconnect', () => {
      if (currentProjectId && currentUser) {
        leaveProject(socket, currentProjectId, currentUser)
      }
    })

    // Heartbeat — keep presence alive
    socket.on('heartbeat', ({ projectId }) => {
      if (currentUser && presence.has(projectId)) {
        currentUser.lastSeen = Date.now()
        presence.get(projectId).set(socket.id, currentUser)
      }
    })
  })

  // Clean zombie sessions every 60s
  setInterval(() => {
    const now = Date.now()
    for (const [projectId, users] of presence.entries()) {
      for (const [socketId, user] of users.entries()) {
        if (now - user.lastSeen > 60_000) {
          users.delete(socketId)
        }
      }
      if (users.size === 0) presence.delete(projectId)
    }
  }, 60_000)

  // ─── Start server ─────────────────────────────────────────────────────────

  httpServer.listen(port, hostname, () => {
    console.log(`✅ Arbo ready on http://${hostname}:${port} [${dev ? 'dev' : 'prod'}]`)
  })

  // Graceful shutdown — warn Socket.IO clients before restart
  process.on('SIGTERM', () => gracefulShutdown(httpServer, io))
  process.on('SIGINT', () => gracefulShutdown(httpServer, io))
})

function leaveProject(socket, projectId, user) {
  socket.leave(`project:${projectId}`)
  if (presence.has(projectId)) {
    presence.get(projectId).delete(socket.id)
    if (presence.get(projectId).size === 0) presence.delete(projectId)
  }
  broadcastPresence(global._io, projectId)
}

function broadcastPresence(io, projectId) {
  const users = presence.has(projectId)
    ? Array.from(presence.get(projectId).values())
    : []
  io.to(`project:${projectId}`).emit('presence-update', { users })
}

function gracefulShutdown(httpServer, io) {
  console.log('→ Graceful shutdown...')
  io.emit('server-restarting')
  httpServer.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
  // Force kill after 10s
  setTimeout(() => process.exit(1), 10_000)
}

function randomColor() {
  const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#06B6D4']
  return colors[Math.floor(Math.random() * colors.length)]
}
