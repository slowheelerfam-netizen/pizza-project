import { ORDER_STATUS } from '../types/models'

const STATUS_SEQUENCE = [
  ORDER_STATUS.NEW,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.IN_PREP,
  ORDER_STATUS.OVEN,
  ORDER_STATUS.READY,
  ORDER_STATUS.COMPLETED,
]

/**
 * Validates if a transition from currentStatus to nextStatus is allowed.
 *
 * Rules:
 * 1. Exact forward sequence allowed (e.g., CREATED -> CONFIRMED).
 * 2. Skipping steps is NOT allowed (e.g., CREATED -> READY is invalid).
 * 3. Backward steps are NOT allowed.
 * 4. Transition to CANCELLED is allowed from ANY state except COMPLETED or already CANCELLED.
 *
 * @param {string} currentStatus - The current status of the order.
 * @param {string} nextStatus - The desired new status.
 * @returns {boolean} - True if transition is valid, false otherwise.
 */
export function isValidTransition(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) {
    return false
  }

  if (nextStatus === ORDER_STATUS.CANCELLED) {
    return (
      currentStatus !== ORDER_STATUS.COMPLETED &&
      currentStatus !== ORDER_STATUS.CANCELLED
    )
  }

  // Allow skipping CONFIRMED (NEW -> IN_PREP)
  if (
    currentStatus === ORDER_STATUS.NEW &&
    nextStatus === ORDER_STATUS.IN_PREP
  ) {
    return true
  }

  const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus)
  const nextIndex = STATUS_SEQUENCE.indexOf(nextStatus)

  if (currentIndex === -1 || nextIndex === -1) {
    return false
  }

  return nextIndex === currentIndex + 1
}
