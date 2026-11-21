export type VdfValue = string | VdfObject

export interface VdfObject {
	readonly [key: string]: VdfValue
}

export class VdfError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'VdfError'
	}
}

type Token =
	| { readonly kind: 'string'; readonly value: string }
	| { readonly kind: 'open' }
	| { readonly kind: 'close' }
	| { readonly kind: 'end' }

const maxDepth = 16

const isSpace = (character: string): boolean =>
	character === ' ' || character === '\t' || character === '\n' || character === '\r' || character === '\ufeff'

/** Parses Valve's KeyValues text format: quoted strings, braces, `//` comments and `\n \t \\ \"` escapes. */
export function parseVdf(text: string): VdfObject {
	let position = 0

	const skipTrivia = (): void => {
		for (;;) {
			while (position < text.length && isSpace(text.charAt(position))) position += 1
			if (!text.startsWith('//', position)) return
			while (position < text.length && text.charAt(position) !== '\n') position += 1
		}
	}

	const readQuoted = (): string => {
		let value = ''
		while (position < text.length) {
			const character = text.charAt(position)
			position += 1
			if (character === '"') return value
			if (character === '\\' && position < text.length) {
				const escaped = text.charAt(position)
				position += 1
				value += escaped === 'n' ? '\n' : escaped === 't' ? '\t' : escaped
			} else {
				value += character
			}
		}
		throw new VdfError('A quoted string is not closed.')
	}

	const next = (): Token => {
		skipTrivia()
		if (position >= text.length) return { kind: 'end' }
		const character = text.charAt(position)
		if (character === '{') {
			position += 1
			return { kind: 'open' }
		}
		if (character === '}') {
			position += 1
			return { kind: 'close' }
		}
		if (character === '"') {
			position += 1
			return { kind: 'string', value: readQuoted() }
		}
		const start = position
		while (position < text.length && !isSpace(text.charAt(position)) && !'{}"'.includes(text.charAt(position))) {
			position += 1
		}
		return { kind: 'string', value: text.slice(start, position) }
	}

	const parseObject = (depth: number): VdfObject => {
		if (depth > maxDepth) throw new VdfError('Nesting is too deep.')
		const entries: [string, VdfValue][] = []
		for (;;) {
			const key = next()
			if (key.kind === 'close') {
				if (depth === 0) throw new VdfError('A closing brace has no block.')
				return Object.fromEntries(entries)
			}
			if (key.kind === 'end') {
				if (depth > 0) throw new VdfError('The file ends inside a block.')
				return Object.fromEntries(entries)
			}
			if (key.kind === 'open') throw new VdfError('A block has no name.')
			const value = next()
			if (value.kind === 'string') entries.push([key.value, value.value])
			else if (value.kind === 'open') entries.push([key.value, parseObject(depth + 1)])
			else throw new VdfError('A key has no value.')
		}
	}

	return parseObject(0)
}

export function vdfString(object: VdfObject, key: string): string | undefined {
	const value = Object.hasOwn(object, key) ? object[key] : undefined
	return typeof value === 'string' ? value : undefined
}

export function vdfObject(object: VdfObject, key: string): VdfObject | undefined {
	const value = Object.hasOwn(object, key) ? object[key] : undefined
	return typeof value === 'object' ? value : undefined
}
