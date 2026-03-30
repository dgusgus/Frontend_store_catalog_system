import { fetcher } from './fetcher'
import type { DiscountResult } from '../types'

export const discountsApi = {
  validate(code: string, cartAmount: number) {
    return fetcher<DiscountResult>('/discounts/validate', {
      method: 'POST',
      body: JSON.stringify({ code, cartAmount }),
    })
  },
}