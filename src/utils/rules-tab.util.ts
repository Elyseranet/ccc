import { RULES_DEFAULT_TAB, RULES_TAB_VALUES } from '~/consts/rules.const'
import type { RULES_TAB } from '~/enums/rules-tab.enum'

export const resolveRulesTab = (hash: string | undefined | null): RULES_TAB => {
  const candidate = (hash ?? '').replace(/^#/, '')
  return RULES_TAB_VALUES.includes(candidate) ? candidate as RULES_TAB : RULES_DEFAULT_TAB
}
