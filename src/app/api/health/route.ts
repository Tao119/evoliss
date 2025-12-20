import { NextResponse } from 'next/server'

export async function GET() {
    try {
        // 簡単なヘルスチェック
        const timestamp = new Date().toISOString()
        const uptime = process.uptime()

        return NextResponse.json({
            status: 'healthy',
            timestamp,
            uptime: Math.floor(uptime),
            memory: process.memoryUsage(),
            pid: process.pid,
            version: process.version,
            env: process.env.NODE_ENV
        })
    } catch (error) {
        return NextResponse.json(
            { status: 'unhealthy', error: 'Health check failed' },
            { status: 500 }
        )
    }
}