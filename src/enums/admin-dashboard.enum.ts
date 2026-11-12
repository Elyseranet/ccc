export enum ADMIN_DASHBOARD_STEP {
  CREATION = 1,
  PARTICIPANTS = 2,
  POOL_DRAW = 3,
  POOL_MATCHES = 4,
  QUALIFIED_VALIDATION = 5,
  BRACKET_DRAW = 6,
  BRACKET_MATCHES = 7,
  FINAL = 8,
  CLOSING = 9
}

export enum ADMIN_DASHBOARD_STEP_STATUS {
  DONE = 'done',
  ACTIVE = 'active',
  PENDING = 'pending'
}

export enum ADMIN_DASHBOARD_TODO {
  RECORDED = 'recorded',
  SCHEDULED = 'scheduled',
  DRAWS = 'draws'
}

export enum ADMIN_DASHBOARD_ERROR {
  SESSION_EXPIRED = 'session_expired',
  FORBIDDEN = 'forbidden',
  NOT_FOUND = 'not_found',
  OTHER = 'other'
}
