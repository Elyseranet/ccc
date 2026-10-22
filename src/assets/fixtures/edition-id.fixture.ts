/*********************************************************
 * Identifiants d'édition de fixture
 *
 * @description
 * Un identifiant stable par code d'édition, partagé par toutes les fixtures.
 ********************************************************/
const CODES = ["2012a","2012b","2013","2014","2015","2016","2017","2018","2019","2020","2021","2022","2023","2024","2025","2026"]

export const editionId = (code: string): string => {
  const index = CODES.indexOf(code)
  return `00000000-0000-4000-0002-${String(index + 1).padStart(12, '0')}`
}
