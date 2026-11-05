import type { API_ERROR_CODE } from '../enums/api-error-code.enum.js'

/** Ce qui empêche le tirage du prochain tour : la liste des qualifiés n'est pas figée, ou le dernier tour n'est pas validé (RG13). */
export type TRoundDrawBlock = API_ERROR_CODE.QUALIFICATION_NOT_DONE | API_ERROR_CODE.ROUND_NOT_COMPLETED
