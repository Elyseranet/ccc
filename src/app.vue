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
import { useMotionPreference } from '~/composables/useMotionPreference'
import { MOTION_HTML_ATTRIBUTE, MOTION_PAUSED_VALUE } from '~/consts/motion.const'

/*********************************************************
 * Application shell
 *
 * @description
 * Provides route announcements and the selected public or admin layout. Carries the animation-pause preference on `<html>`
 * (`data-motion="paused"`, cookie `ccc_motion`, T-A11Y-01 M5).
 ********************************************************/
const props = withDefaults(defineProps<{}>(), {})
const emits = defineEmits<{}>()
defineSlots<{}>()
const { paused } = useMotionPreference()
useHead({ htmlAttrs: { [MOTION_HTML_ATTRIBUTE]: () => paused.value ? MOTION_PAUSED_VALUE : undefined } })

/*********************************************************
 * Expose
 *
 * @description
 * The root shell exposes no controls to a parent component.
 ********************************************************/
defineExpose({})
</script>
