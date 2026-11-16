export type TLoginAttemptReservation =
  | { reserved: true, failedCount: number }
  | { reserved: false, retryAfterSeconds: number }
