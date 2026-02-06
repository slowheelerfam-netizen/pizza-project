export const DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true' &&
  process.env.DEMO_MODE === 'true'

  export const IS_PROD =
  process.env.VERCEL_ENV === 'production' &&
  !DEMO_MODE
