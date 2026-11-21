/** @jsxImportSource @gambrel/view */
import { Plus } from '@gambrel/icons'
import type { Child } from '@gambrel/view'
import { SearchIcon } from '../icons.ts'
import { NavLink } from './nav-link.tsx'

export interface AppShellProps {
	readonly pathname: string
	readonly children: Child
}

export function AppShell(props: AppShellProps): Child {
	const { pathname } = props
	return (
		<div class="shell">
			<a class="skip-link" href="#main">
				Skip to content
			</a>
			<header class="topbar" data-topbar>
				<a class="wordmark" href="/" aria-label="Cairn home">
					<img src="/assets/favicon.svg" alt="" width="28" height="28" />
					<span>Cairn</span>
				</a>
				<nav class="topnav" aria-label="Primary">
					<ul>
						<li><NavLink href="/" label="Home" active={pathname === '/'} /></li>
						<li><NavLink href="/library" label="Library" active={pathname === '/library' || pathname.startsWith('/games')} /></li>
						<li><NavLink href="/collections" label="Collections" active={pathname === '/collections'} /></li>
						<li><NavLink href="/integrations" label="Integrations" active={pathname === '/integrations'} /></li>
						<li><NavLink href="/runtime" label="Runtime" active={pathname === '/runtime'} /></li>
					</ul>
				</nav>
				<div class="topbar-tools">
					<form class="topbar-search" role="search" action="/library" method="get">
						<label class="visually-hidden" for="topbar-search">
							Search the library
						</label>
						<input id="topbar-search" type="search" name="q" placeholder="Titles" maxlength="100" autocomplete="off" />
						<button type="submit" aria-label="Search">
							<SearchIcon size={20} />
						</button>
					</form>
					<a class="topbar-add" href="/games/new" aria-label="Add game">
						<Plus size={22} />
					</a>
					<span class="avatar" role="img" aria-label="Guest profile">
						G
					</span>
				</div>
			</header>
			<main id="main" class="shell-main" tabindex="-1">
				{props.children}
			</main>
		</div>
	)
}
