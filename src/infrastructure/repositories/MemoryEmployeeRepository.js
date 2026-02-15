// In-memory implementation for Demo Mode
let mockEmployees = [
  {
    id: 'emp-1',
    name: 'Mario',
    role: 'CHEF',
    isOnDuty: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'emp-2',
    name: 'Luigi',
    role: 'COOK',
    isOnDuty: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'emp-3',
    name: 'Peaches',
    role: 'FRONT_COUNTER',
    isOnDuty: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export class MemoryEmployeeRepository {
  async getAll() {
    return [...mockEmployees]
  }

  async saveAll(employees) {
    mockEmployees = employees
  }
}
