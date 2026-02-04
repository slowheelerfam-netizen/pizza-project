/**
 * Generates a formatted text representation of a physical order label.
 *
 * LAYOUT (TOP -> BOTTOM):
 * 1. Menu items (line-by-line)
 * 2. Optional modifiers or notes
 * 3. Approximately 1 inch (≈25mm) of vertical blank space
 * 4. Restaurant name (script or cursive font, smaller)
 * 5. ORDER NAME (bold, final line)
 *
 * @param {Object} order - The order object.
 * @returns {string} - The formatted label text.
 */
export function generateLabelText(order) {
  const lines = []

  // 1. Menu items
  order.items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.size || 'Standard'} ${item.name} (${item.crust || 'Original'})`
    )
    if (item.toppings && item.toppings.length > 0) {
      // Format toppings as list
      const toppingStr = Array.isArray(item.toppings)
        ? item.toppings.join(', ')
        : item.toppings
      lines.push(`   + ${toppingStr}`)
    }
    // 2. Modifiers or notes
    if (item.notes) {
      lines.push(`   [NOTE: ${item.notes}]`)
    }
  })

  // 3. Vertical blank space (~1 inch)
  // Representing 1 inch as ~6 blank lines in a standard terminal/monospace font
  for (let i = 0; i < 6; i++) {
    lines.push('')
  }

  // 4. Restaurant name (simulated script font with pseudo-styling)
  lines.push('~ Pizza Palace ~')

  // 5. ORDER NAME (BOLD, FINAL LINE)
  // Using uppercase to simulate bold/emphasis
  const customerName = order.customerSnapshot?.name || 'GUEST'
  lines.push(`*** ${customerName.toUpperCase()} ***`)

  return lines.join('\n')
}
