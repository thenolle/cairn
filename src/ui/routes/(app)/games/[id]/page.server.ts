import { notFound } from '@gambrel/router'
import type { Loader, ParamsOf } from '@gambrel/router'
import { isLaunchOutcome, launchMessages } from '../../../../../shared/launch.ts'
import { installStateLabel, platformLabel, sourceLabel } from '../../../../../shared/library.ts'
import type { PageContext } from '../../../../context.server.ts'
import { isMetadataOutcome, metadataMessages } from '../../../../../shared/metadata.ts'

export type CollectionRef = {
	readonly id: string
	readonly name: string
}

export type SessionView = {
	readonly startedAt: number
	readonly seconds: number
}

export type SimilarGame = {
	readonly id: string
	readonly name: string
	readonly platform: string
	readonly coverUrl: string | null
	readonly heroUrl: string | null
}

export type GameDetails = {
	readonly id: string
	readonly name: string
	readonly platform: string
	readonly source: string
	readonly installState: string
	readonly installed: boolean
	readonly favorite: boolean
	readonly playtimeSeconds: number
	readonly lastPlayedAt: number | null
	readonly createdAt: number
	readonly coverUrl: string | null
	readonly heroUrl: string | null
	readonly canLaunch: boolean
	readonly activeSince: number | null
	readonly notice: { readonly message: string; readonly ok: boolean } | null
	readonly sessions: readonly SessionView[]
	readonly collections: readonly CollectionRef[]
	readonly otherCollections: readonly CollectionRef[]
	readonly similar: readonly SimilarGame[]
	readonly metadataAvailable: boolean
}

export const loader: Loader<ParamsOf<'/games/[id]'>, GameDetails, PageContext> = ({ params, search, context }) => {
	const game = context.library.get(params.id)
	if (game === undefined) return notFound()
	const art = context.artwork.urlsOf(game.id)
	const member = context.collections.forGame(game.id)
	const memberIds = new Set(member.map((collection) => collection.id))
	const outcome = new URLSearchParams(search).get('launch')
	const fetched = new URLSearchParams(search).get('metadata')
	const peers = context.library.list({ text: '', platform: game.platform, favoritesOnly: false, sort: 'name', cursor: null, limit: 7 }).games.filter((peer) => peer.id !== game.id).slice(0, 6)
	const peerArt = context.artwork.urlsFor(peers.map((peer) => peer.id))
	return {
		id: game.id,
		name: game.name,
		platform: platformLabel(game.platform),
		source: sourceLabel(game.source),
		installState: installStateLabel(game.installState),
		installed: game.installState === 'installed',
		favorite: game.favorite,
		playtimeSeconds: game.playtimeSeconds,
		lastPlayedAt: game.lastPlayedAt,
		createdAt: game.createdAt,
		coverUrl: art.cover,
		heroUrl: art.hero,
		canLaunch: context.launcher.canLaunch(game.source) && game.installState === 'installed',
		activeSince: context.activity.activeSince(game.id),
		notice: outcome !== null && isLaunchOutcome(outcome) ? { message: launchMessages[outcome], ok: outcome === 'started' } : fetched !== null && isMetadataOutcome(fetched) ? { message: metadataMessages[fetched], ok: fetched === 'updated' } : null,
		metadataAvailable: context.metadata.available(),
		sessions: context.activity.recentSessions(game.id, 5).filter((session) => session.endedAt !== null).map((session) => ({ startedAt: session.startedAt, seconds: session.seconds })),
		collections: member.map((collection) => ({ id: collection.id, name: collection.name })),
		otherCollections: context.collections.list().filter((collection) => !memberIds.has(collection.id)).map((collection) => ({ id: collection.id, name: collection.name })),
		similar: peers.map((peer) => ({
			id: peer.id,
			name: peer.name,
			platform: platformLabel(peer.platform),
			coverUrl: peerArt.get(peer.id)?.cover ?? null,
			heroUrl: peerArt.get(peer.id)?.hero ?? null
		}))
	}
}
