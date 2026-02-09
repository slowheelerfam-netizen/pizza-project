import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(
  process.cwd(),
  'data',
  'employees.json'
)

export class FileEmployeeRepository {
  async getAll() {
    if (!fs.existsSync(DATA_FILE)) {
      return []
    }

    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw)
  }

  async saveAll(employees) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(employees, null, 2),
      'utf-8'
    )
  }
}
