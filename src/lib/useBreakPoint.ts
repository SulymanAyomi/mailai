'use client'
import { useMediaQuery } from 'usehooks-ts'

export function useBreakpoint() {
  return {
    isMobile: useMediaQuery('(max-width: 767px)'),
    isTablet: useMediaQuery('(min-width: 768px) and (max-width: 1023px)'),
    isDesktop: useMediaQuery('(min-width: 1024px)'),
  }
}
