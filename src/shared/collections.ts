export const collectionNameMax = 60

export type Collection = {
	readonly id: string
	readonly name: string
	readonly createdAt: number
	readonly gameCount: number
}

export type CollectionError = 'invalid_name' | 'duplicate' | 'not_found'

export const collectionErrorMessages: Readonly<Record<CollectionError, string>> = {
	invalid_name: `Enter a name of up to ${collectionNameMax} characters.`,
	duplicate: 'A collection with that name already exists.',
	not_found: 'That collection no longer exists.'
}

export function isCollectionError(value: string): value is CollectionError {
	return Object.hasOwn(collectionErrorMessages, value)
}
