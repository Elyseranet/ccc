import { RULES_DEFAULT_TAB, RULES_TAB_VALUES } from '../consts/rules.const.js'
import type { RULES_TAB } from '../enums/rules-tab.enum.js'

export const resolveRulesTab = (hash: string | undefined | null): RULES_TAB => {
  const candidate = (hash ?? '').replace(/^#/, '')
  return RULES_TAB_VALUES.includes(candidate) ? candidate as RULES_TAB : RULES_DEFAULT_TAB
}
