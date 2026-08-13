const STORAGE_PREFIX = 'shorts.onboarding.'

export function hasSeenOnboarding(key: string): boolean {
  try {
    return localStorage.getItem(STORAGE_PREFIX + key) === '1'
  } catch {
    return false
  }
}

export function markOnboardingSeen(key: string): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, '1')
  } catch {
    // ignore
  }
}
