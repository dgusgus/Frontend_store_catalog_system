// src/composables/useWhatsApp.ts

import { useCartStore }     from '../stores/cart.store'
import { useSettingsStore } from '../stores/settings.store'

export interface CustomerData {
  name:  string
  phone: string
}

export type WhatsAppTarget = 'app' | 'web'

export function useWhatsApp() {
  const cart     = useCartStore()
  const settings = useSettingsStore()

  function buildMessage(customer: CustomerData, orderNumber: string | null): string {
    const lines: string[] = []

    lines.push('🛍️ *NUEVO PEDIDO*')
    if (orderNumber) {
      lines.push(`📋 *${orderNumber}*`)
    }
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    lines.push('\n👤 *Cliente*')
    lines.push(`   Nombre:    ${customer.name}`)
    lines.push(`   Teléfono:  ${customer.phone}`)

    lines.push('\n🛒 *Productos*')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    cart.items.forEach(item => {
      const variant  = item.variantName ? ` _(${item.variantName})_` : ''
      const subtotal = (item.price * item.quantity).toFixed(2)
      lines.push(`\n• *${item.productName}*${variant}`)
      lines.push(`  ${item.quantity} × $${item.price.toFixed(2)} = *$${subtotal}*`)
    })

    lines.push('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (cart.discountResult) {
      lines.push(`Subtotal:                    $${cart.subtotal.toFixed(2)}`)
      lines.push(`Descuento (${cart.discountResult.code}): -$${cart.discountAmount.toFixed(2)}`)
      lines.push(`\n💰 *TOTAL: $${cart.total.toFixed(2)}*`)
      lines.push(`   _(ahorraste $${cart.discountAmount.toFixed(2)})_`)
    } else {
      lines.push(`\n💰 *TOTAL: $${cart.total.toFixed(2)}*`)
    }

    lines.push('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    if (orderNumber) {
      lines.push(`_Para confirmar buscá el pedido *${orderNumber}* en el sistema_ 🏪`)
    } else {
      lines.push('_Enviado desde la tienda online_ 🏪')
    }

    return lines.join('\n')
  }

  function buildUrl(
    customer: CustomerData,
    target: WhatsAppTarget,
    orderNumber: string | null
  ): string {
    const number  = settings.whatsappNumber
    const message = buildMessage(customer, orderNumber)
    const encoded = encodeURIComponent(message)

    if (target === 'web') {
      return `https://web.whatsapp.com/send?phone=${number}&text=${encoded}`
    }
    return `https://wa.me/${number}?text=${encoded}`
  }

  function openWhatsApp(
    customer: CustomerData,
    target: WhatsAppTarget,
    orderNumber: string | null = null
  ): void {
    const url = buildUrl(customer, target, orderNumber)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return {
    buildMessage,
    openWhatsApp,
    hasWhatsapp: settings.hasWhatsapp,
  }
}