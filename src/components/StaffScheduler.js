'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { demoStorage } from '../lib/demoStorage'
import {
  addEmployeeAction,
  toggleEmployeeDutyAction,
  deleteEmployeeAction,
} from '../app/actions'

const ROLES = ['Front Counter', 'Chef', 'Cook', 'Float']

export default function StaffScheduler({ employees: initialEmployees }) {
  const router = useRouter()
  // Local state to merge server and local employees
  const [employees, setEmployees] = useState(initialEmployees)

  const [newEmployeeName, setNewEmployeeName] = useState('')
  const [selectedRole, setSelectedRole] = useState(ROLES[0])
  const [isAdding, setIsAdding] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Sync when prop updates + Load Local Storage
  useEffect(() => {
    // Merge server employees with local storage employees
    const localEmployees = demoStorage.getEmployees()
    // Create a map by ID to merge
    const empMap = new Map()

    // Add server employees first
    initialEmployees.forEach((e) => empMap.set(e.id, e))

    // Add/Overwrite with local employees
    localEmployees.forEach((e) => empMap.set(e.id, e))

    setEmployees(Array.from(empMap.values()))
  }, [initialEmployees])

  async function handleAdd(e) {
    e.preventDefault()
    if (!newEmployeeName.trim()) return

    setIsAdding(true)
    const formData = new FormData()
    formData.append('name', newEmployeeName)
    formData.append('role', selectedRole)

    const result = await addEmployeeAction(null, formData)

    // Fallback: Save to Local Storage if server action fails
    if (result && !result.success) {
      demoStorage.addEmployee(newEmployeeName, selectedRole)
      // Trigger a local state update by re-running the effect logic or router refresh
      router.refresh()
    }

    setNewEmployeeName('')
    setIsAdding(false)
  }

  return (
    <div className="rounded-3xl border border-white/50 bg-white/80 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Staff Assignments</h2>
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 shadow-sm">
          {employees.filter((e) => Boolean(e.isOnDuty)).length} On Duty
        </span>
      </div>

      {/* Add New Staff */}
      <form onSubmit={handleAdd} className="mb-6 flex flex-col gap-3">
        <div>
          <label className="mb-2 block text-sm font-bold text-gray-700">
            Employee Name
          </label>
          <input
            type="text"
            placeholder="e.g. Jane Smith"
            value={newEmployeeName}
            onChange={(e) => setNewEmployeeName(e.target.value)}
            className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-gray-900 shadow-inner ring-1 ring-gray-200 transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="flex-1 rounded-xl border-0 bg-gray-50 px-4 py-3 text-gray-900 shadow-inner ring-1 ring-gray-200 transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
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
            className="rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40 disabled:opacity-50 disabled:shadow-none"
          >
            Add
          </button>
        </div>
      </form>

      {/* Staff List */}
      <div className="space-y-4">
        {ROLES.map((role) => {
          const roleEmployees = employees.filter((e) => e.role === role)
          if (roleEmployees.length === 0) return null

          return (
            <div key={role}>
              <h3 className="mb-3 text-xs font-extrabold tracking-wider text-indigo-900 uppercase">
                {role}
              </h3>
              <div className="space-y-2">
                {roleEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full shadow-sm ${
                          emp.isOnDuty
                            ? 'bg-green-500 ring-2 ring-green-200'
                            : 'bg-gray-300'
                        }`}
                      />
                      <span
                        className={`font-bold ${
                          emp.isOnDuty ? 'text-gray-900' : 'text-gray-600'
                        }`}
                      >
                        {emp.name}{' '}
                        {emp.isOnDuty && (
                          <span className="ml-1 text-xs font-extrabold text-green-700">
                            (Active)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          // Optimistic update
                          const newStatus = !emp.isOnDuty
                          setEmployees((prev) =>
                            prev.map((e) =>
                              e.id === emp.id
                                ? { ...e, isOnDuty: newStatus }
                                : e
                            )
                          )

                          const result = await toggleEmployeeDutyAction(
                            emp.id,
                            newStatus
                          )

                          if (result && !result.success) {
                            demoStorage.toggleEmployeeDuty(emp.id, newStatus)
                          }
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
                          // Optimistic
                          setEmployees((prev) =>
                            prev.filter((e) => e.id !== emp.id)
                          )

                          const result = await deleteEmployeeAction(emp.id)
                          if (result && !result.success) {
                            demoStorage.deleteEmployee(emp.id)
                          }
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
