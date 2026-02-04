
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const employees = await prisma.employee.findMany()
  console.log('Employees:', JSON.stringify(employees, null, 2))
  
  // Check types explicitly
  employees.forEach(e => {
    console.log(`Name: ${e.name}, isOnDuty: ${e.isOnDuty}, Type: ${typeof e.isOnDuty}`)
  })
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
