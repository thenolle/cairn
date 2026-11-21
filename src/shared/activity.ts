export type ActiveGame = {
	readonly gameId: string
	readonly startedAt: number
}

export type ActivitySnapshot = {
	readonly active: readonly ActiveGame[]
	readonly at: number
}

export type PlaySession = {
	readonly id: string
	readonly startedAt: number
	readonly endedAt: number | null
	readonly seconds: number
}
