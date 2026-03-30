import { fetcher } from './fetcher'
import type { Category } from '../types'

export const categoriesApi = {
  getAll() {
    return fetcher<Category[]>('/categories')
  },
}