import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let _client: PrismaClient | undefined

export async function db() {
  if (_client) return _client
  if (globalForPrisma.prisma) {
    _client = globalForPrisma.prisma
    return _client
  }

  const tursoUrl = process.env.TURSO_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  console.log('[db] TURSO_URL:', tursoUrl ? tursoUrl.substring(0, 30) + '...' : 'undefined')
  console.log('[db] TURSO_AUTH_TOKEN:', tursoToken ? 'present' : 'undefined')

  if (tursoUrl && tursoToken) {
    try {
      const { PrismaLibSQL } = await import('@prisma/adapter-libsql')
      const { createClient } = await import('@libsql/client')
      console.log('[db] Creating libsql client with URL:', tursoUrl)
      const libsql = createClient({ url: tursoUrl, authToken: tursoToken })
      const adapter = new PrismaLibSQL(libsql)
      console.log('[db] Creating PrismaClient with adapter')
      _client = new PrismaClient({ adapter })
      console.log('[db] PrismaClient created successfully')
    } catch (e) {
      console.error('[db] Error creating adapter client:', e)
      _client = new PrismaClient()
    }
  } else {
    console.log('[db] Falling back to standard PrismaClient')
    _client = new PrismaClient()
  }

  globalForPrisma.prisma = _client
  return _client
}
