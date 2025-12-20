import { NextResponse } from 'next/server'

let requestCount = 0
let lastAccess = new Date()

export async function GET() {
    requestCount++
    lastAccess = new Date()

    return NextResponse.json({
        status: 'alive',
        timestamp: lastAccess.toISOString(),
        requestCount,
        uptime: Math.floor(process.uptime()),
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        },
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform
    })
}

export async function POST() {
    // POST でも同じレスポンス（より確実なKeep-alive）
    return GET()
}