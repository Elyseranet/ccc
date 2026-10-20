<template>
  <origam-app>
    <nuxt-route-announcer />
    <nuxt-layout>
      <nuxt-page />
    </nuxt-layout>
  </origam-app>
</template>

<script setup lang="ts">
import { OrigamApp } from 'origam/components'

/*********************************************************
 * Application shell
 *
 * @description
 * Provides route announcements and the selected public or admin layout.
 ********************************************************/
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()

/*********************************************************
 * Expose
 *
 * @description
 * The root shell exposes no controls to a parent component.
 ********************************************************/
defineExpose({})
</script>
