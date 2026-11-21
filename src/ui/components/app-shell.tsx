/** @jsxImportSource @gambrel/view */
import { Compass, FolderOpen, Gauge } from '@gambrel/icons'
import type { Child } from '@gambrel/view'
import { GameTile } from './game-tile.tsx'
import { NavLink } from './nav-link.tsx'

export type PinnedGame = {
	readonly id: string
	readonly name: string
	readonly coverUrl: string | null
}

export type AppShellProps = {
	readonly pathname: string
	readonly pinned: readonly PinnedGame[]
	readonly children: Child
}

export function AppShell(props: AppShellProps): Child {
	const { pathname } = props
	return (
		<div class="shell">
			<a class="skip-link" href="#main">
				Skip to content
			</a>
			<nav class="shell-nav" aria-label="Primary">
				<a class="brand" href="/" aria-label="Cairn home">
					<img src="/assets/favicon.svg" alt="" width="36" height="36" />
				</a>
				<ul class="nav-list">
					<li>
						<NavLink href="/" label="Home" active={pathname === '/'}>
							<Compass size={22} />
						</NavLink>
					</li>
					<li>
						<NavLink href="/library" label="Library" active={pathname === '/library' || pathname.startsWith('/games')}>
							<FolderOpen size={22} />
						</NavLink>
					</li>
				</ul>
				{props.pinned.length === 0 ? null : (
					<ul class="pinned-list" aria-label="Favorites">
						{props.pinned.map((game) => (
							<li>
								<a class="pinned-game" href={`/games/${game.id}`} aria-label={game.name} title={game.name}>
									<GameTile name={game.name} coverUrl={game.coverUrl} />
								</a>
							</li>
						))}
					</ul>
				)}
				<ul class="nav-list nav-foot">
					<li>
						<NavLink href="/runtime" label="Runtime" active={pathname === '/runtime'}>
							<Gauge size={22} />
						</NavLink>
					</li>
				</ul>
			</nav>
			<main id="main" class="shell-main" tabindex="-1">
				{props.children}
			</main>
		</div>
	)
}
