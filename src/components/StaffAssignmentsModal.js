'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { demoStorage } from '../lib/demoStorage'
import {
  addEmployeeAction,
  toggleEmployeeDutyAction,
  deleteEmployeeAction,
} from '../app/actions'

const ROLES = ['Front Counter', 'Chef', 'Cook', 'Float', 'Driver']

export default function StaffAssignmentsModal({
  isOpen,
  onClose,
  employees: initialEmployees = [],
}) {
  const router = useRouter()
  // Local state to merge server and local employees
  const [employees, setEmployees] = useState(initialEmployees)
  const [isEnabled, setIsEnabled] = useState(false) // Default disabled

  const [newEmployeeName, setNewEmployeeName] = useState('')
  const [selectedRole, setSelectedRole] = useState(ROLES[0])
  const [isAdding, setIsAdding] = useState(false)
  // eslint-disable-next-line no-unused-vars
  const [isPending, startTransition] = useTransition()

  // Sync when prop updates + Load Local Storage
  useEffect(() => {
    if (!isOpen) return

    // Load Settings
    const settings = demoStorage.getSettings()
    setIsEnabled(settings.staffAssignmentsEnabled || false)

    // Merge server employees with local storage employees
    const localEmployees = demoStorage.getEmployees()
    const empMap = new Map()

    // Add server employees first
    initialEmployees.forEach((e) =>
      empMap.set(e.id, { ...e, isOnDuty: Boolean(e.isOnDuty) })
    )

    // Add/Overwrite with local employees
    localEmployees.forEach((e) =>
      empMap.set(e.id, { ...e, isOnDuty: Boolean(e.isOnDuty), lastPunchTime: e.lastPunchTime })
    )

    setEmployees(Array.from(empMap.values()))
  }, [initialEmployees, isOpen])

  const toggleGlobalEnabled = (e) => {
    const val = e.target.checked
    setIsEnabled(val)
    demoStorage.saveSettings({ staffAssignmentsEnabled: val })
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!newEmployeeName.trim()) return

    setIsAdding(true)
    const formData = new FormData()
    formData.append('name', newEmployeeName)
    formData.append('role', selectedRole)

    const result = await addEmployeeAction(null, formData)

    if (result && !result.success) {
      const newEmp = demoStorage.addEmployee(newEmployeeName, selectedRole)
      // Optimistic update locally
      setEmployees((prev) => [...prev, newEmp])
      router.refresh()
    }

    setNewEmployeeName('')
    setIsAdding(false)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <h2 className="text-2xl font-black text-gray-900">
            Staff Assignments
          </h2>
          <button
            onClick={onClose}
            className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Global Toggle */}
        <div className="mb-6 flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={toggleGlobalEnabled}
              className="peer sr-only"
            />
            <div className="peer h-7 w-14 rounded-full bg-gray-200 peer-focus:ring-4 peer-focus:ring-indigo-300 peer-focus:outline-none peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:left-[4px] after:top-0.5 after:h-6 after:w-6 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-['']"></div>
            <span className="ml-3 text-sm font-bold text-gray-900">
              {isEnabled
                ? 'Staff Assignments ENABLED'
                : 'Staff Assignments DISABLED'}
            </span>
          </label>
        </div>

        {/* Content */}
        <div
          className={
            !isEnabled ? 'pointer-events-none opacity-50 grayscale' : ''
          }
        >
          {/* Add New Staff */}
          <form
            onSubmit={handleAdd}
            className="mb-6 flex items-end gap-3 rounded-xl bg-indigo-50 p-4"
          >
            <div className="flex-1">
              <label className="mb-1 block text-xs font-bold text-indigo-900">
                New Employee Name
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={newEmployeeName}
                onChange={(e) => setNewEmployeeName(e.target.value)}
                className="w-full rounded-lg border-2 border-indigo-100 p-2 font-bold text-gray-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="w-1/3">
              <label className="mb-1 block text-xs font-bold text-indigo-900">
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full rounded-lg border-2 border-indigo-100 p-2 font-bold text-gray-900 focus:border-indigo-500 focus:outline-none"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={!newEmployeeName.trim() || isAdding}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 font-bold text-white shadow-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Add
            </button>
          </form>

          {/* Staff List */}
          <div className="max-h-[400px] space-y-4 overflow-y-auto">
            {employees.length === 0 && (
              <div className="py-10 text-center font-bold text-gray-400">
                No employees added yet
              </div>
            )}

            {employees.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-black text-white ${
                      emp.isOnDuty ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-lg font-black text-gray-900">
                      {emp.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">
                        {emp.role}
                      </span>
                      {emp.isOnDuty && emp.lastPunchTime && (
                        <span className="text-xs font-medium text-green-600">
                          • In at{' '}
                          {new Date(emp.lastPunchTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      const newStatus = !emp.isOnDuty
                      // Optimistic
                      setEmployees((prev) =>
                        prev.map((e) =>
                          e.id === emp.id
                            ? {
                                ...e,
                                isOnDuty: newStatus,
                                lastPunchTime: newStatus
                                  ? new Date().toISOString()
                                  : e.lastPunchTime,
                              }
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
                    className={`min-w-[120px] rounded-lg px-4 py-2 text-sm font-bold text-white shadow-md transition-all ${
                      emp.isOnDuty
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {emp.isOnDuty ? 'Punch Out' : 'Punch IN'}
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm('Remove this employee?')) return
                      setEmployees((prev) =>
                        prev.filter((e) => e.id !== emp.id)
                      )
                      await deleteEmployeeAction(emp.id)
                      demoStorage.deleteEmployee(emp.id)
                      router.refresh()
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
