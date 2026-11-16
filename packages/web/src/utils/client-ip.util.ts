import { BlockList, isIP } from 'node:net'
import { getRequestHeader, getRequestIP } from 'h3'
import type { H3Event } from 'h3'
import { FORWARDED_FOR_HEADER, TRUST_PROXY_HOPS_MAX, TRUSTED_PROXY_SUBNETS } from '../consts/request.const.js'

const trustedProxyRanges = new BlockList()
for (const { network, prefix, family } of TRUSTED_PROXY_SUBNETS) {
  trustedProxyRanges.addSubnet(network, prefix, family)
}

/** Vrai si l'adresse de la socket peut être un proxy de confiance (boucle locale ou réseau privé). */
export const isTrustedProxyAddress = (address: string | undefined): boolean => {
  const family = address === undefined ? 0 : isIP(address)
  return family !== 0 && trustedProxyRanges.check(address!, family === 4 ? 'ipv4' : 'ipv6')
}

/** `trustProxyHops` doit être un entier de 0 à `TRUST_PROXY_HOPS_MAX` ; le message nomme le réglage, pas sa valeur. */
export const assertTrustProxyHops = (value: unknown): number => {
  const hops = Number(value)
  if (!Number.isSafeInteger(hops) || hops < 0 || hops > TRUST_PROXY_HOPS_MAX) {
    throw new Error(`Invalid setting NUXT_TRUST_PROXY_HOPS: expected an integer from 0 to ${TRUST_PROXY_HOPS_MAX}`)
  }
  return hops
}

/**
 * IP du client pour les limites de débit. Sans proxy de confiance (`trustedProxyHops` = 0, défaut), c'est l'adresse de
 * la socket : `X-Forwarded-For` est ignoré, car le client le forge librement. Il l'est aussi quand la socket ne vient pas
 * d'une plage de `TRUSTED_PROXY_SUBNETS` : la requête n'est alors pas passée par le proxy. Avec N proxys de confiance devant le
 * serveur, chacun ajoute à droite de la chaîne l'adresse de son pair : l'entrée N en partant de la droite est celle que
 * le premier proxy a vue, donc le vrai client ; ce qu'un client a mis à gauche est ignoré. Une chaîne plus courte que N
 * ou une entrée qui n'est pas une IP retombe sur l'adresse de la socket (le proxy) : comptage plus large, jamais
 * contournable.
 */
export const resolveClientIp = (
  remoteAddress: string | undefined,
  forwardedFor: string | undefined,
  trustedProxyHops: number
): string | undefined => {
  if (trustedProxyHops <= 0 || !forwardedFor || !isTrustedProxyAddress(remoteAddress)) {
    return remoteAddress
  }
  const chain = forwardedFor.split(',').map((entry) => entry.trim()).filter((entry) => entry !== '')
  const candidate = chain[chain.length - trustedProxyHops]
  return candidate !== undefined && isIP(candidate) !== 0 ? candidate : remoteAddress
}

/** IP du client selon la politique de proxy de `runtimeConfig.trustProxyHops`. */
export const getClientIp = (event: H3Event): string | undefined =>
  resolveClientIp(
    getRequestIP(event),
    getRequestHeader(event, FORWARDED_FOR_HEADER),
    assertTrustProxyHops(useRuntimeConfig().trustProxyHops)
  )
