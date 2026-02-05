import { APP_CONFIG } from './appConfig'

export function isDemoMode() {
  return APP_CONFIG.DEMO_MODE === true
}
