const placeholder = '{game}'
const maxTokens = 20
const maxTokenLength = 200
const maxLength = 400

/**
 * Splits an argument template into separate arguments. Arguments are separated by spaces and must include
 * `{game}` at least once. No other braces are allowed. Returns null when the template is not acceptable.
 */
export function parseArgumentTemplate(template: string): readonly string[] | null {
	if (template.length > maxLength || /\p{Cc}/u.test(template)) return null
	const tokens = template.trim().split(/ +/u).filter((token) => token !== '')
	if (tokens.length === 0 || tokens.length > maxTokens) return null
	let hasGame = false
	for (const token of tokens) {
		if (token.length > maxTokenLength || /[{}]/u.test(token.replaceAll(placeholder, ''))) return null
		if (token.includes(placeholder)) hasGame = true
	}
	return hasGame ? tokens : null
}

/** Builds the argument list for a game. The game's path becomes part of one argument and is never split or interpreted. */
export function buildArguments(template: string, gamePath: string): readonly string[] | null {
	const tokens = parseArgumentTemplate(template)
	return tokens === null ? null : tokens.map((token) => token.replaceAll(placeholder, gamePath))
}
