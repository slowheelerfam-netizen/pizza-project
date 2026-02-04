import fs from 'fs/promises'
import path from 'path'
import pkg from '@prisma/client'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

const { PrismaClient } = pkg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load env from project root
dotenv.config({ path: path.join(__dirname, '../../.env') })

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
})

const DATA_DIR = path.join(__dirname, '../data')

async function migrate() {
  console.log('Starting migration...')
  console.log('Database URL:', process.env.DATABASE_URL)

  // Migrate Warnings
  try {
    const warningsData = await fs.readFile(
      path.join(DATA_DIR, 'warnings.json'),
      'utf-8'
    )
    const warnings = JSON.parse(warningsData)

    console.log(`Found ${warnings.length} warnings.`)

    for (const w of warnings) {
      // Check existence
      const exists = await prisma.warning.findUnique({ where: { id: w.id } })
      if (exists) continue

      await prisma.warning.create({
        data: {
          id: w.id,
          reason: w.reason,
          isActive: w.isActive,
          createdBy: w.createdBy,
          createdAt: new Date(w.createdAt),
          targetPhone: w.customerIdentifier?.phone,
          targetName: w.customerIdentifier?.name,
          targetPaymentId: w.customerIdentifier?.paymentId,
        },
      })
    }
    console.log('Warnings migrated.')
  } catch (e) {
    if (e.code === 'ENOENT') console.log('No warnings.json found.')
    else console.error('Error migrating warnings:', e.message)
  }

  // Migrate Orders
  try {
    const ordersData = await fs.readFile(
      path.join(DATA_DIR, 'orders.json'),
      'utf-8'
    )
    const orders = JSON.parse(ordersData)

    console.log(`Found ${orders.length} orders.`)

    for (const o of orders) {
      const exists = await prisma.order.findUnique({ where: { id: o.id } })
      if (exists) continue

      await prisma.order.create({
        data: {
          id: o.id,
          status: o.status,
          source: o.source,
          totalPrice: o.totalPrice,
          createdAt: new Date(o.createdAt),
          updatedAt: o.updatedAt
            ? new Date(o.updatedAt)
            : new Date(o.createdAt),

          customerName: o.customerSnapshot?.name,
          customerPhone: o.customerSnapshot?.phone,
          customerType: o.customerSnapshot?.type || 'PICKUP',
          customerAddress: o.customerSnapshot?.address,
          isWalkIn: o.customerSnapshot?.isWalkIn || false,

          items: {
            create: o.items.map((item) => ({
              name: item.name,
              size: item.size,
              crust: item.crust,
              price: item.price,
              quantity: item.quantity || 1,
              notes: item.notes,
              toppings: JSON.stringify(item.toppings || []),
            })),
          },
        },
      })
    }
    console.log('Orders migrated.')
  } catch (e) {
    if (e.code === 'ENOENT') console.log('No orders.json found.')
    else console.error('Error migrating orders:', e.message)
  }

  // Migrate Actions
  try {
    const actionsData = await fs.readFile(
      path.join(DATA_DIR, 'actions.json'),
      'utf-8'
    )
    const actions = JSON.parse(actionsData)

    console.log(`Found ${actions.length} actions.`)

    for (const a of actions) {
      const exists = await prisma.adminAction.findUnique({
        where: { id: a.id },
      })
      if (exists) continue

      await prisma.adminAction.create({
        data: {
          id: a.id,
          actionType: a.actionType,
          targetEntityType: a.targetEntityType,
          targetEntityId: a.targetEntityId,
          payload: JSON.stringify(a.payload || {}),
          performedBy: a.performedBy,
          performedAt: new Date(a.performedAt),
        },
      })
    }
    console.log('Actions migrated.')
  } catch (e) {
    if (e.code === 'ENOENT') console.log('No actions.json found.')
    else console.error('Error migrating actions:', e.message)
  }
}

migrate()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
