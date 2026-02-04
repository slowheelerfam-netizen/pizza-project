
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('--- STARTING TOGGLE TEST ---')
  
  // 1. Create a test employee
  const testName = `Test-${Date.now()}`
  const emp = await prisma.employee.create({
    data: {
      name: testName,
      role: 'Cook',
      isOnDuty: false // Start OFF
    }
  })
  
  console.log(`Created employee: ${emp.name}, isOnDuty: ${emp.isOnDuty} (Type: ${typeof emp.isOnDuty})`)
  
  // 2. Toggle ON
  const toggledOn = await prisma.employee.update({
    where: { id: emp.id },
    data: { isOnDuty: true }
  })
  console.log(`Toggled ON: ${toggledOn.name}, isOnDuty: ${toggledOn.isOnDuty} (Type: ${typeof toggledOn.isOnDuty})`)
  
  // 3. Toggle OFF
  const toggledOff = await prisma.employee.update({
    where: { id: emp.id },
    data: { isOnDuty: false }
  })
  console.log(`Toggled OFF: ${toggledOff.name}, isOnDuty: ${toggledOff.isOnDuty} (Type: ${typeof toggledOff.isOnDuty})`)
  
  // 4. Cleanup
  await prisma.employee.delete({ where: { id: emp.id } })
  console.log('Test employee deleted.')
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
