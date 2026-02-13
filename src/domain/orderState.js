import { ORDER_STATUS } from '../types/models'

/**
 * Canonical, linear order flow.
 * No legacy states. No branching. No skipping.
 *
 * NEW → PREP → OVEN → READY
 */
const STATUS_SEQUENCE = [
  ORDER_STATUS.NEW,
  ORDER_STATUS.PREP,
  ORDER_STATUS.OVEN,
  ORDER_STATUS.READY,
  ORDER_STATUS.COMPLETED,
]

export function isValidTransition(orderOrStatus, nextStatus) {
  const currentStatus =
    typeof orderOrStatus === 'string'
      ? orderOrStatus
      : orderOrStatus?.status

  if (!currentStatus) return false
  if (currentStatus === nextStatus) return false

  // Allow skipping PREP (Prep) if advancing directly from Register
  if (currentStatus === ORDER_STATUS.NEW && nextStatus === ORDER_STATUS.OVEN) {
    return true
  }

  const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus)
  const nextIndex = STATUS_SEQUENCE.indexOf(nextStatus)

  // Reject unknown / legacy statuses (IN_PREP, CONFIRMED, etc.)
  if (currentIndex === -1 || nextIndex === -1) return false

  // Only allow strict forward movement by one step
  return nextIndex === currentIndex + 1
}
