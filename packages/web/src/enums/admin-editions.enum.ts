export enum EDITION_FORM_MODE {
  CREATE = 'create',
  EDIT = 'edit'
}

/** Raison pour laquelle la règle de l'année échoue : le composant traduit chaque cas. */
export enum EDITION_YEAR_ISSUE {
  REQUIRED = 'required',
  FORMAT = 'format',
  RANGE = 'range'
}

/** Champs que la fiche d'une édition montre en lecture seule (R-9, édition clôturée). */
export enum EDITION_READONLY_FIELD {
  CODE = 'code',
  YEAR = 'year',
  STATUS = 'status',
  NAME = 'name',
  DATE = 'date',
  LOCATION = 'location',
  PARTICIPANTS = 'participants'
}
