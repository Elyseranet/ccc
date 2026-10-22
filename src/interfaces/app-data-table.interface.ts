import type { IDataTableEmits, IDataTableProps, IDataTableSlots } from 'origam/interfaces'

export interface IAppDataTableProps extends Omit<IDataTableProps, 'item' | 'items'> {
  items?: any[]
}

export interface IAppDataTableEmits extends IDataTableEmits {}

export interface IAppDataTableSlots<T = any> extends IDataTableSlots<T> {}
