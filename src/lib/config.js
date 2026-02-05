import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'src/data')

export const DB_PATHS = {
  ORDERS: path.join(DATA_DIR, 'orders.json'),
  WARNINGS: path.join(DATA_DIR, 'warnings.json'),
  NOTIFICATIONS: path.join(DATA_DIR, 'notifications.json'),
  ACTIONS: path.join(DATA_DIR, 'actions.json'),
  EMPLOYEES: path.join(DATA_DIR, 'employees.json'),
}
