export interface IErrorPageError {
  statusCode?: number
  statusMessage?: string
  message?: string
}

export interface IErrorPageProps {
  error: IErrorPageError
}
