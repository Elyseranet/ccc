import type { INavigationItem } from './navigation.interface.js'

export interface IAdminMoreItem extends INavigationItem {
  description: Pick<INavigationItem, 'key' | 'label'>
}
