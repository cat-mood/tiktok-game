import os from 'node:os'

function isIPv4(adapter: os.NetworkInterfaceInfo): boolean {
  return adapter.family === 'IPv4' || (adapter.family as unknown as number) === 4
}

function isUsefulLan(address: string): boolean {
  if (address.startsWith('169.254.') || address.startsWith('198.18.')) {
    return false
  }
  return (
    address.startsWith('192.168.') ||
    address.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(address)
  )
}

export function lanAddresses(): string[] {
  const all: string[] = []
  for (const adapters of Object.values(os.networkInterfaces())) {
    for (const adapter of adapters ?? []) {
      if (isIPv4(adapter) && !adapter.internal) {
        all.push(adapter.address)
      }
    }
  }
  const lan = all.filter(isUsefulLan)
  return lan.length > 0 ? lan : all
}
