import { kv } from '@vercel/kv'

const PREFIX = 'demo:orders'
const TTL = 60 * 60 // 1 hour

export class KvOrderRepository {
  async list() {
    const keys = await kv.keys(`${PREFIX}:*`)
    if (!keys.length) return []
    const values = await kv.mget(keys)
    return values.filter(Boolean)
  }

  async getById(id) {
    return kv.get(`${PREFIX}:${id}`)
  }

  async save(order) {
    await kv.set(`${PREFIX}:${order.id}`, order, { ex: TTL })
    return order
  }

  async delete(id) {
    await kv.del(`${PREFIX}:${id}`)
  }

  async clearAll() {
    const keys = await kv.keys(`${PREFIX}:*`)
    if (keys.length) await kv.del(...keys)
  }
}

