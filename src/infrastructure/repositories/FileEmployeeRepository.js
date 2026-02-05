import fs from 'fs/promises'
import { DB_PATHS } from '../../lib/config'

const DATA_FILE = DB_PATHS.EMPLOYEES
const TMP_FILE = `${DATA_FILE}.tmp`

let writeLock = Promise.resolve()

export class FileEmployeeRepository {
  async _runWithLock(operation) {
    writeLock = writeLock.then(operation, operation)
    return writeLock
  }

  async _readAll() {
    try {
      const raw = await fs.readFile(DATA_FILE, 'utf-8')
      return JSON.parse(raw)
    } catch (err) {
      if (err.code === 'ENOENT') {
        return []
      }
      throw err
    }
  }

  async _writeAll(items) {
    await fs.writeFile(TMP_FILE, JSON.stringify(items, null, 2))
    await fs.rename(TMP_FILE, DATA_FILE)
  }

  async getAll() {
    return this._readAll()
  }

  async findById(id) {
    const items = await this._readAll()
    return items.find((i) => i.id === id) || null
  }

  async create(data) {
    return this._runWithLock(async () => {
      const items = await this._readAll()
      const newItem = {
        id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        ...data,
      }
      items.push(newItem)
      await this._writeAll(items)
      return newItem
    })
  }

  async update(updatedItem) {
    return this._runWithLock(async () => {
      const items = await this._readAll()
      const index = items.findIndex((i) => i.id === updatedItem.id)

      if (index === -1) {
        throw new Error(`Employee ${updatedItem.id} not found`)
      }

      items[index] = { ...items[index], ...updatedItem }
      await this._writeAll(items)
      return items[index]
    })
  }

  async delete(id) {
    return this._runWithLock(async () => {
      const items = await this._readAll()
      const newItems = items.filter((i) => i.id !== id)

      await this._writeAll(newItems)
      return true
    })
  }
}
