import { IPV6_PREFIX_GROUPS, IPV6_TOTAL_GROUPS } from '../consts/rate-limit.const'

const IPV4_MAPPED_PATTERN = /^::ffff:\d{1,3}(\.\d{1,3}){3}$/i

const expandIpv6 = (address: string): string[] => {
  const [head = '', tail] = address.split('::')
  const headGroups = head === '' ? [] : head.split(':')
  const tailGroups = tail === undefined || tail === '' ? [] : tail.split(':')
  const missing = tail === undefined ? 0 : IPV6_TOTAL_GROUPS - headGroups.length - tailGroups.length
  return [...headGroups, ...Array<string>(Math.max(missing, 0)).fill('0'), ...tailGroups]
}

/**
 * Clé de comptage d'une IP : une IPv6 est agrégée par préfixe /64 (un client en possède des
 * milliards de milliards) ; une IPv4, y compris sous la forme `::ffff:a.b.c.d`, reste entière.
 */
export const normalizeIpForRateLimit = (ip: string): string => {
  const address = ip.split('%')[0]!.toLowerCase()
  if (!address.includes(':') || IPV4_MAPPED_PATTERN.test(address)) {
    return address
  }
  const prefix = expandIpv6(address)
    .slice(0, IPV6_PREFIX_GROUPS)
    .map((group) => (Number.parseInt(group, 16) || 0).toString(16))
  return `${prefix.join(':')}::/64`
}
