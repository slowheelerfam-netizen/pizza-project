'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  addEmployeeAction,
  toggleEmployeeDutyAction,
  deleteEmployeeAction,
} from '../app/actions'

const ROLES = ['Front Counter', 'Chef', 'Cook', 'Float']

export default function StaffScheduler({ employees }) {
  const router = useRouter()
  const [newEmployeeName, setNewEmployeeName] = useState('')
  const [selectedRole, setSelectedRole] = useState(ROLES[0])
  const [isAdding, setIsAdding] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Optimistic UI state
  const [optimisticEmployees, setOptimisticEmployees] = useState(employees)

  // Sync when prop updates
  if (JSON.stringify(employees) !== JSON.stringify(optimisticEmployees)) {
    // This is a simplified sync, in a real app use useOptimistic hook
    // For now, let's just rely on prop updates but we need to ensure the parent is re-rendering
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!newEmployeeName.trim()) return

    setIsAdding(true)
    const formData = new FormData()
    formData.append('name', newEmployeeName)
    formData.append('role', selectedRole)

    await addEmployeeAction(null, formData)
    setNewEmployeeName('')
    setIsAdding(false)
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Staff Assignments</h2>
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
          {employees.filter((e) => Boolean(e.isOnDuty)).length} On Duty
        </span>
      </div>

      {/* Add New Staff */}
      <form onSubmit={handleAdd} className="mb-6 flex gap-3">
        <input
          type="text"
          placeholder="Employee Name"
          value={newEmployeeName}
          onChange={(e) => setNewEmployeeName(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
        />
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!newEmployeeName.trim() || isAdding}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {/* Staff List */}
      <div className="space-y-4">
        {ROLES.map((role) => {
          const roleEmployees = employees.filter((e) => e.role === role)
          if (roleEmployees.length === 0) return null

          return (
            <div key={role}>
              <h3 className="mb-2 text-xs font-bold tracking-wider text-indigo-900 uppercase">
                {role}
              </h3>
              <div className="space-y-2">
                {roleEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${emp.isOnDuty ? 'bg-green-500' : 'bg-gray-300'}`}
                      />
                      <span
                        className={`font-medium ${emp.isOnDuty ? 'text-gray-900' : 'text-gray-700'}`}
                      >
                        {emp.name}{' '}
                        {emp.isOnDuty && (
                          <span className="ml-1 text-green-600">(On Duty)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          await toggleEmployeeDutyAction(emp.id, !emp.isOnDuty)
                          router.refresh()
                        }}
                        className={`rounded px-3 py-1 text-xs font-bold text-white transition-colors ${
                          emp.isOnDuty
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {emp.isOnDuty ? 'Clock Out' : 'Clock In'}
                      </button>
                      <button
                        onClick={async () => {
                          await deleteEmployeeAction(emp.id)
                          router.refresh()
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-red-100 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {employees.length === 0 && (
          <p className="text-center text-sm text-gray-500 italic">
            No staff assigned yet.
          </p>
        )}
      </div>
    </div>
  )
}
