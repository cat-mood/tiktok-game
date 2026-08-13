import type { DepartmentId } from './types.js'

export type DepartmentInfo = {
  id: DepartmentId
  emoji: string
  name: string
  description: string
}

export const DEPARTMENTS: DepartmentInfo[] = [
  {
    id: 'development',
    emoji: '👨‍💻',
    name: 'Development',
    description: 'Собираем, как работает приложение',
  },
  {
    id: 'design',
    emoji: '🎨',
    name: 'Design',
    description: 'Собираем интерфейс и состояния',
  },
  {
    id: 'marketing',
    emoji: '📢',
    name: 'Marketing',
    description: 'Готовим запуск продукта',
  },
  {
    id: 'qa',
    emoji: '🔍',
    name: 'QA',
    description: 'Проверяем продукт тест-кейсами',
  },
]

export const DEPARTMENT_IDS: DepartmentId[] = DEPARTMENTS.map((d) => d.id)

export function getDepartment(id: DepartmentId): DepartmentInfo {
  const dept = DEPARTMENTS.find((d) => d.id === id)
  if (!dept) {
    throw new Error(`Unknown department: ${id}`)
  }
  return dept
}

export function isDepartmentId(value: string): value is DepartmentId {
  return DEPARTMENT_IDS.includes(value as DepartmentId)
}
