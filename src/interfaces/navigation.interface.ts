import type { Component } from 'vue'

export interface INavigationItem {
  key: string
  label: string
  to: string
  icon?: Component
  exact?: boolean
}

export interface INavigationGroup {
  key: string
  label: string
  items: INavigationItem[]
}
