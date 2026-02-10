import { ORDER_STATUS } from '../types/models'

const STATUS_SEQUENCE = [
  ORDER_STATUS.NEW,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.IN_PREP,
  ORDER_STATUS.MONITOR,
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
 * 5. assumeChefRole logic:
 *    - If TRUE: NEW -> MONITOR (skips PREP). NEW -> PREP is DENIED.
 *    - If FALSE: NEW -> PREP -> MONITOR. NEW -> MONITOR is DENIED.
 *
 * @param {object|string} orderOrStatus - The order object or current status string (legacy).
 * @param {string} nextStatus - The desired new status.
 * @returns {boolean} - True if transition is valid, false otherwise.
 */
export function isValidTransition(orderOrStatus, nextStatus) {
  const currentStatus = typeof orderOrStatus === 'string' ? orderOrStatus : orderOrStatus.status
  const assumeChefRole = typeof orderOrStatus === 'object' ? orderOrStatus.assumeChefRole : false

  if (currentStatus === nextStatus) {
    return false
  }

  if (nextStatus === ORDER_STATUS.CANCELLED) {
    return (
      currentStatus !== ORDER_STATUS.COMPLETED &&
      currentStatus !== ORDER_STATUS.CANCELLED
    )
  }

  // RULE 2: If assumeChefRole = TRUE
  //   ALLOW: NEW → MONITOR
  //   DENY:  NEW → PREP
  if (assumeChefRole) {
    if (currentStatus === ORDER_STATUS.NEW && nextStatus === ORDER_STATUS.MONITOR) {
      return true
    }
    if (currentStatus === ORDER_STATUS.NEW && nextStatus === ORDER_STATUS.IN_PREP) {
      return false
    }
  }

  // RULE 1: If assumeChefRole = FALSE
  //   ALLOW: NEW → PREP
  //   DENY:  NEW → MONITOR
  if (!assumeChefRole) {
    if (currentStatus === ORDER_STATUS.NEW && nextStatus === ORDER_STATUS.MONITOR) {
      return false
    }
    // Allow skipping CONFIRMED (NEW -> IN_PREP)
    if (
      currentStatus === ORDER_STATUS.NEW &&
      nextStatus === ORDER_STATUS.IN_PREP
    ) {
      return true
    }
  }
  
  // Standard Sequence Check
  const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus)
  const nextIndex = STATUS_SEQUENCE.indexOf(nextStatus)

  if (currentIndex === -1 || nextIndex === -1) {
    return false
  }

  return nextIndex === currentIndex + 1
}
