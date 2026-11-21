export type EmulatorProfile = {
	readonly platform: string
	readonly name: string
	readonly executable: string
	readonly arguments: string
	readonly updatedAt: number
}

export type EmulatorError = 'invalid_platform' | 'invalid_name' | 'invalid_path' | 'not_found' | 'invalid_arguments'

export const emulatorErrorMessages: Readonly<Record<EmulatorError, string>> = {
	invalid_platform: 'Choose one of the listed platforms.',
	invalid_name: 'Enter a name of up to 60 characters.',
	invalid_path: 'Enter the full path of the emulator program. On Windows it must be an .exe file.',
	not_found: 'That file could not be found.',
	invalid_arguments: 'Arguments must include {game} and use no other braces. Separate arguments with spaces.'
}

export function isEmulatorError(value: string): value is EmulatorError {
	return Object.hasOwn(emulatorErrorMessages, value)
}
