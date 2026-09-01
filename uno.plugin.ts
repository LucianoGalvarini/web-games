import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, ViteDevServer } from 'vite'
import { WebSocketServer } from 'ws'
import type { WebSocket } from 'ws'

type UnoDispatch = {
  apiCreateRoom: (name: string) => { room: unknown; token: string; playerId: string }
  apiJoinRoom: (roomId: string, name: string) => { room: unknown; token: string; playerId: string }
  handleMessage: (
    ws: { send: (data: string) => void; readyState: number },
    ctx: { roomId: string; playerId: string } | null,
    msg: unknown,
  ) => { ctx: { roomId: string; playerId: string } | null; close: boolean }
  handleDisconnect: (ctx: { roomId: string; playerId: string } | null, ws: { send: (data: string) => void; readyState: number }) => void
  errorMessage: (err: unknown) => string
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export function unoPlugin(): Plugin {
  return {
    name: 'uno-server',
    configureServer(server) {
      attachUno(server)
    },
  }
}

function attachUno(server: ViteDevServer) {
  const load = () => server.ssrLoadModule('/src/uno/dispatch.ts') as Promise<UnoDispatch>

  server.middlewares.use(async (req, res, next) => {
    if (req.method !== 'POST') {
      next()
      return
    }
    const url = req.url?.split('?')[0] ?? ''
    const join = url.match(/^\/api\/rooms\/([^/]+)\/join$/)
    if (url !== '/api/rooms' && !join) {
      next()
      return
    }

    try {
      const uno = await load()
      let body: { name?: string } = {}
      try {
        const raw = await readBody(req)
        body = raw ? (JSON.parse(raw) as { name?: string }) : {}
      } catch {
        json(res, 400, { error: 'Pedido inválido.' })
        return
      }
      const name = typeof body.name === 'string' ? body.name : ''
      const result = url === '/api/rooms' ? uno.apiCreateRoom(name) : uno.apiJoinRoom(join![1], name)
      json(res, 200, result)
    } catch (err) {
      const uno = await load().catch(() => null)
      json(res, 400, { error: uno?.errorMessage(err) ?? 'Algo salió mal.' })
    }
  })

  const wss = new WebSocketServer({ noServer: true })

  server.httpServer?.on('upgrade', (req, socket, head) => {
    const pathname = req.url?.split('?')[0]
    if (pathname !== '/ws') return
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req)
    })
  })

  wss.on('connection', (ws: WebSocket) => {
    let ctx: { roomId: string; playerId: string } | null = null
    const sink = {
      send: (data: string) => {
        if (ws.readyState === ws.OPEN) ws.send(data)
      },
      get readyState() {
        return ws.readyState === ws.OPEN ? 1 : 0
      },
    }

    ws.on('message', async (raw) => {
      let msg: unknown
      try {
        msg = JSON.parse(raw.toString())
      } catch {
        return
      }
      try {
        const uno = await load()
        const result = uno.handleMessage(sink, ctx, msg)
        ctx = result.ctx
        if (result.close) ws.close()
      } catch (err) {
        const uno = await load().catch(() => null)
        ws.send(JSON.stringify({ type: 'error', message: uno?.errorMessage(err) ?? 'Algo salió mal.' }))
      }
    })

    ws.on('close', async () => {
      const uno = await load().catch(() => null)
      uno?.handleDisconnect(ctx, sink)
    })
  })
}
