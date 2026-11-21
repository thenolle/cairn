export const folderPlatforms = ['nintendo-switch', 'nintendo-3ds', 'nintendo-ds'] as const

export type FolderPlatform = (typeof folderPlatforms)[number]

export function isFolderPlatform(value: string): value is FolderPlatform {
	return (folderPlatforms as readonly string[]).includes(value)
}

export type LibraryFolder = {
	readonly id: string
	readonly path: string
	readonly platform: string
	readonly createdAt: number
}

export type FolderError = 'invalid_path' | 'not_a_folder' | 'invalid_platform' | 'duplicate'

export const folderErrorMessages: Readonly<Record<FolderError, string>> = {
	invalid_path: 'Enter the full path of a folder, such as D:\\Games\\DS.',
	not_a_folder: 'That folder could not be found.',
	invalid_platform: 'Choose one of the listed platforms.',
	duplicate: 'That folder has already been added.'
}

export function isFolderError(value: string): value is FolderError {
	return Object.hasOwn(folderErrorMessages, value)
}
