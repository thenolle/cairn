import { stat } from 'node:fs/promises'
import { isAbsolute, resolve } from 'node:path'
import { isFolderPlatform } from '../../shared/folders.ts'
import type { EmulatorError, EmulatorProfile } from '../../shared/emulators.ts'
import type { SqliteEmulatorRepository } from '../database/repositories/emulator-repository.ts'
import { cleanGameName } from '../integrations/clean-name.ts'
import { isAllowedExecutable } from '../os/process-plan.ts'
import { parseArgumentTemplate } from './arguments.ts'

export type EmulatorResult =
	| { readonly ok: true; readonly profile: EmulatorProfile }
	| { readonly ok: false; readonly error: EmulatorError }

export interface EmulatorServiceOptions {
	readonly platform: string
	readonly now?: () => number
}

export interface EmulatorInput {
	readonly platform: string
	readonly name: string
	readonly executable: string
	readonly arguments: string
}

const fail = (error: EmulatorError): EmulatorResult => ({ ok: false, error })

/** The emulator chosen for each platform. Programs are checked when saved and again when a game starts. */
export class EmulatorService {
	private readonly repository: SqliteEmulatorRepository
	private readonly platform: string
	private readonly now: () => number

	constructor(repository: SqliteEmulatorRepository, options: EmulatorServiceOptions) {
		this.repository = repository
		this.platform = options.platform
		this.now = options.now ?? Date.now
	}

	list(): readonly EmulatorProfile[] {
		return this.repository.list()
	}

	get(platform: string): EmulatorProfile | null {
		return this.repository.find(platform)
	}

	async save(input: EmulatorInput): Promise<EmulatorResult> {
		if (!isFolderPlatform(input.platform)) return fail('invalid_platform')
		const name = cleanGameName(input.name).slice(0, 60)
		if (name === '') return fail('invalid_name')
		const executable = input.executable.trim()
		if (executable === '' || executable.length > 1024 || executable.includes('\0') || !isAbsolute(executable)) return fail('invalid_path')
		const resolved = resolve(executable)
		if (!isAllowedExecutable(resolved, this.platform)) return fail('invalid_path')
		try {
			const info = await stat(resolved)
			if (!info.isFile()) return fail('not_found')
			if (this.platform !== 'win32' && (info.mode & 0o111) === 0) return fail('invalid_path')
		} catch {
			return fail('not_found')
		}
		const template = input.arguments.trim()
		if (parseArgumentTemplate(template) === null) return fail('invalid_arguments')
		const profile: EmulatorProfile = { platform: input.platform, name, executable: resolved, arguments: template, updatedAt: this.now() }
		this.repository.save(profile)
		return { ok: true, profile }
	}

	remove(platform: string): boolean {
		return this.repository.remove(platform)
	}
}
