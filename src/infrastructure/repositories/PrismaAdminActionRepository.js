import { prisma } from '../../lib/prisma'

export class PrismaAdminActionRepository {
  async getAll() {
    const actions = await prisma.adminAction.findMany({
      orderBy: { performedAt: 'desc' }
    })
    return actions.map(this._mapToDomain)
  }

  async findByTarget(targetEntityType, targetEntityId) {
    const actions = await prisma.adminAction.findMany({
      where: {
        targetEntityType,
        targetEntityId
      },
      orderBy: { performedAt: 'desc' }
    })
    return actions.map(this._mapToDomain)
  }

  async create(action) {
    const { id, ...rest } = action
    
    const created = await prisma.adminAction.create({
      data: {
        ...(id && { id }),
        actionType: rest.actionType,
        targetEntityType: rest.targetEntityType,
        targetEntityId: rest.targetEntityId,
        payload: JSON.stringify(rest.payload || {}),
        performedBy: rest.performedBy,
        performedAt: rest.performedAt ? new Date(rest.performedAt) : undefined
      }
    })
    
    return this._mapToDomain(created)
  }
  
  _mapToDomain(p) {
    return {
      id: p.id,
      actionType: p.actionType,
      targetEntityType: p.targetEntityType,
      targetEntityId: p.targetEntityId,
      payload: JSON.parse(p.payload),
      performedBy: p.performedBy,
      performedAt: p.performedAt.toISOString()
    }
  }
}
