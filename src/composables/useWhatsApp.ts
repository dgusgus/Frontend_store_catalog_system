// src/composables/useWhatsApp.ts
//
// FIX: el mensaje se arma desde los datos de la Order devuelta por el backend,
// no desde cart.items. Así funciona aunque el carrito ya esté limpio.

import { useSettingsStore } from '../stores/settings.store'
import type { Order }       from '../api/orders'

export type WhatsAppTarget = 'app' | 'web'

export function useWhatsApp() {
  const settings = useSettingsStore()

  // Arma el mensaje a partir de la orden ya creada en el backend
  function buildMessageFromOrder(order: Order): string {
    const lines: string[] = []

    lines.push('🛍️ *NUEVO PEDIDO*')
    lines.push(`📋 *${order.orderNumber}*`)
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    lines.push('\n👤 *Cliente*')
    lines.push(`   Nombre:    ${order.customerName}`)
    lines.push(`   Teléfono:  ${order.customerPhone}`)

    lines.push('\n🛒 *Productos*')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Usamos order.items — ya están guardados en la DB con sus snapshots
    order.items.forEach(item => {
      const variant  = item.variantName ? ` _(${item.variantName})_` : ''
      const subtotal = Number(item.subtotal).toFixed(2)
      lines.push(`\n• *${item.productName}*${variant}`)
      lines.push(`  ${item.quantity} × $${Number(item.unitPrice).toFixed(2)} = *$${subtotal}*`)
    })

    lines.push('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (Number(order.discountAmount) > 0) {
      lines.push(`Subtotal:                    $${Number(order.subtotal).toFixed(2)}`)
      lines.push(`Descuento (${order.discountCode}): -$${Number(order.discountAmount).toFixed(2)}`)
      lines.push(`\n💰 *TOTAL: $${Number(order.total).toFixed(2)}*`)
      lines.push(`   _(ahorraste $${Number(order.discountAmount).toFixed(2)})_`)
    } else {
      lines.push(`\n💰 *TOTAL: $${Number(order.total).toFixed(2)}*`)
    }

    lines.push('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push(`_Confirmá el pedido *${order.orderNumber}* en el sistema_ 🏪`)

    return lines.join('\n')
  }

  function openWhatsApp(order: Order, target: WhatsAppTarget = 'app'): void {
    const number  = settings.whatsappNumber
    if (!number) return

    const message = buildMessageFromOrder(order)
    const encoded = encodeURIComponent(message)

    const url = target === 'web'
      ? `https://web.whatsapp.com/send?phone=${number}&text=${encoded}`
      : `https://wa.me/${number}?text=${encoded}`

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return {
    buildMessageFromOrder,
    openWhatsApp,
    hasWhatsapp: settings.hasWhatsapp,
  }
}