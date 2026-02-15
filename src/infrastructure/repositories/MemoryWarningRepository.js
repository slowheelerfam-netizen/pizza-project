// In-memory implementation for Demo Mode
let mockWarnings = []

export class MemoryWarningRepository {
  async create(warning) {
    mockWarnings.push(warning)
    return warning
  }

  async deactivate(warningId) {
    const idx = mockWarnings.findIndex((w) => w.id === warningId)
    if (idx === -1) return null
    
    mockWarnings[idx] = { ...mockWarnings[idx], isActive: false }
    return mockWarnings[idx]
  }

  async findActiveByPhone(phone) {
    return mockWarnings.find(
      (w) =>
        w.isActive !== false &&
        w.customerIdentifier?.phone === phone
    ) || null
  }

  async findActiveByIdentifiers({ phone, name, paymentId }) {
    return mockWarnings.filter((w) => {
      if (w.isActive === false) return false
      if (phone && w.customerIdentifier?.phone === phone) return true
      if (
        name &&
        w.customerIdentifier?.name &&
        w.customerIdentifier.name.toLowerCase() === name.toLowerCase()
      )
        return true
      if (paymentId && w.customerIdentifier?.paymentId === paymentId) return true
      return false
    })
  }

  async getAll() {
    return [...mockWarnings]
  }
}
