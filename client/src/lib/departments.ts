import { DEPARTMENTS, type DepartmentId, type GameState } from '@brainrot/shared'

export function departmentCount(state: GameState, id: DepartmentId): number {
  return state.players.filter((player) => player.departmentId === id).length
}

export function playerCountLabel(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) {
    return `${count} игрок`
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} игрока`
  }
  return `${count} игроков`
}

export function departmentById(id: DepartmentId) {
  return DEPARTMENTS.find((dept) => dept.id === id)!
}
