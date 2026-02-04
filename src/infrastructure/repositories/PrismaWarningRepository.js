import { prisma } from '../../lib/prisma'

export class PrismaWarningRepository {
  async getAll() {
    const warnings = await prisma.warning.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return warnings.map(this._mapToDomain)
  }

  async findActiveByIdentifiers({ phone, name, paymentId }) {
    // Prisma OR query
    const warnings = await prisma.warning.findMany({
      where: {
        isActive: true,
        OR: [
          { targetPhone: phone },
          // Case insensitive search for name usually requires raw query or specialized collation in SQLite.
          // Prisma doesn't support case-insensitive mode directly for SQLite in standard queries easily without Raw.
          // But let's try standard equals for now, or fetch all active and filter in memory if dataset is small?
          // For "Hardening", we should do it right. SQLite `LIKE` is case insensitive for ASCII.
          // `targetName` equals?
          // Let's use `name` check if provided.
          ...(name ? [{ targetName: name }] : []),
          ...(paymentId ? [{ targetPaymentId: paymentId }] : [])
        ]
      }
    })
    
    // SQLite LIKE is case-insensitive by default.
    // If we want exact match but case insensitive, we can use that.
    // But `findMany` uses exact match by default.
    
    return warnings.map(this._mapToDomain)
  }

  async create(warning) {
    const { id, customerIdentifier, ...rest } = warning
    
    const created = await prisma.warning.create({
      data: {
        ...(id && { id }),
        reason: rest.reason,
        isActive: rest.isActive ?? true,
        createdBy: rest.createdBy,
        createdAt: rest.createdAt ? new Date(rest.createdAt) : undefined,
        
        targetPhone: customerIdentifier?.phone,
        targetName: customerIdentifier?.name,
        targetPaymentId: customerIdentifier?.paymentId
      }
    })
    
    return this._mapToDomain(created)
  }

  async deactivate(warningId) {
    try {
      const updated = await prisma.warning.update({
        where: { id: warningId },
        data: { isActive: false }
      })
      return this._mapToDomain(updated)
    } catch (e) {
      if (e.code === 'P2025') return null // Record not found
      throw e
    }
  }
  
  _mapToDomain(p) {
    return {
      id: p.id,
      reason: p.reason,
      isActive: p.isActive,
      createdBy: p.createdBy,
      createdAt: p.createdAt.toISOString(),
      customerIdentifier: {
        phone: p.targetPhone,
        name: p.targetName,
        paymentId: p.targetPaymentId
      }
    }
  }
}
