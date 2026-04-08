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

  // ── Construcción del mensaje ─────────────────────────────
  function buildMessage(customer: CustomerData): string {
    const lines: string[] = []

    lines.push('🛍️ *NUEVO PEDIDO*')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Datos del cliente
    lines.push('\n👤 *Cliente*')
    lines.push(`   Nombre:    ${customer.name}`)
    lines.push(`   Teléfono:  ${customer.phone}`)

    // Productos
    lines.push('\n🛒 *Productos*')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    cart.items.forEach(item => {
      const variant  = item.variantName ? ` _(${item.variantName})_` : ''
      const subtotal = (item.price * item.quantity).toFixed(2)
      lines.push(`\n• *${item.productName}*${variant}`)
      lines.push(`  ${item.quantity} × $${item.price.toFixed(2)} = *$${subtotal}*`)
    })

    // Totales
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
    lines.push('_Enviado desde la tienda online_ 🏪')

    return lines.join('\n')
  }

  // ── URLs según destino elegido por el usuario ─────────────
  function buildUrl(customer: CustomerData, target: WhatsAppTarget): string {
    const number  = settings.whatsappNumber
    const message = buildMessage(customer)
    const encoded = encodeURIComponent(message)

    if (target === 'web') {
      // Abre directamente WhatsApp Web en el navegador
      return `https://web.whatsapp.com/send?phone=${number}&text=${encoded}`
    }

    // wa.me detecta automáticamente el dispositivo:
    // móvil → abre la app, desktop → ofrece la app de escritorio o WhatsApp Web
    return `https://wa.me/${number}?text=${encoded}`
  }

  function openWhatsApp(customer: CustomerData, target: WhatsAppTarget): void {
    const url = buildUrl(customer, target)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return {
    buildMessage,
    openWhatsApp,
    hasWhatsapp: settings.hasWhatsapp,
  }
}