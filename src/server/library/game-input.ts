import { isPlatformKey } from '../../shared/library.ts'

export const maxNameLength = 200

export interface GameInput {
	readonly name: string
	readonly platform: string
}

export type GameInputError = 'name_required' | 'name_too_long' | 'platform_invalid'

export type GameInputResult =
	| { readonly ok: true; readonly value: GameInput }
	| { readonly ok: false; readonly error: GameInputError }

/** Validates the fields of the add and edit forms. Control characters become spaces. */
export function parseGameForm(form: FormData): GameInputResult {
	const rawName = form.get('name')
	const rawPlatform = form.get('platform')
	const name = typeof rawName === 'string' ? rawName.replace(/\p{Cc}/gu, ' ').replace(/\s+/gu, ' ').trim() : ''
	if (name === '') return { ok: false, error: 'name_required' }
	if (name.length > maxNameLength) return { ok: false, error: 'name_too_long' }
	if (typeof rawPlatform !== 'string' || !isPlatformKey(rawPlatform)) return { ok: false, error: 'platform_invalid' }
	return { ok: true, value: { name, platform: rawPlatform } }
}
