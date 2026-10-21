import type { INavigationItem } from '~/interfaces/navigation.interface'

export interface IAdminMoreItem extends INavigationItem {
  description: Pick<INavigationItem, 'key' | 'label'>
}
