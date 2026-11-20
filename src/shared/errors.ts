export type CairnErrorCode = 'config_invalid' | 'platform_unsupported' | 'io_failed'

/** An expected failure with a stable code that callers can branch on. */
export class CairnError extends Error {
	readonly code: CairnErrorCode

	constructor(code: CairnErrorCode, message: string, options?: ErrorOptions) {
		super(message, options)
		this.name = 'CairnError'
		this.code = code
	}
}
