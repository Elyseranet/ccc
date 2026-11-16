import { IF_MATCH_HEADER } from '../consts/if-match.const.js'

/** En-tête `If-Match: "<version>"` d'une écriture versionnée (SEC-Q). Côté navigateur ; la lecture serveur est `if-match.util`. */
export const toIfMatchHeaders = (version: number): Record<string, string> => ({ [IF_MATCH_HEADER]: `"${version}"` })
