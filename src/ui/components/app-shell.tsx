/** @jsxImportSource @gambrel/view */
import { Plus } from '@gambrel/icons'
import type { Child } from '@gambrel/view'
import { ChevronDownIcon, SearchIcon } from '../icons.ts'
import { NavLink } from './nav-link.tsx'

export interface AppShellProps {
	readonly pathname: string
	readonly search: string
	readonly children: Child
}

export function AppShell(props: AppShellProps): Child {
	const { pathname } = props
	const params = new URLSearchParams(props.search)
	const inLibrary = pathname === '/library'
	const favorites = inLibrary && params.get('favorites') === '1'
	const recent = inLibrary && params.get('sort') === 'added'
	const browsing = (inLibrary && !favorites && !recent) || pathname.startsWith('/games')
	return (
		<div class="shell">
			<a class="skip-link" href="#main">Skip to content</a>
			<header class="topbar" data-topbar>
				<a class="wordmark" href="/" aria-label="Cairn home">
					<img src="/assets/favicon.svg" alt="" width="28" height="28" />
					<span>Cairn</span>
				</a>
				<nav class="topnav" aria-label="Primary">
					<ul>
						<li><NavLink href="/" label="Home" active={pathname === '/'} /></li>
						<li><NavLink href="/library" label="Library" active={browsing} /></li>
						<li><NavLink href="/library?favorites=1" label="My List" active={favorites} /></li>
						<li><NavLink href="/library?sort=added" label="Recently Added" active={recent} /></li>
						<li><NavLink href="/collections" label="Collections" active={pathname === '/collections'} /></li>
					</ul>
				</nav>
				<div class="topbar-tools">
					<form class="topbar-search" role="search" action="/library" method="get">
						<label class="visually-hidden" for="topbar-search">Search the library</label>
						<input id="topbar-search" type="search" name="q" placeholder="Titles" maxlength="100" autocomplete="off" />
						<button type="submit" aria-label="Search"><SearchIcon size={20} /></button>
					</form>
					<details class="account">
						<summary aria-label="Guest profile menu"><span class="avatar" aria-hidden="true">G</span><ChevronDownIcon size={14} /></summary>
						<ul class="account-menu">
							<li><a href="/games/new"><Plus size={16} /> <span>Add a game</span></a></li>
							<li><a href="/integrations">Integrations</a></li>
							<li><a href="/runtime">Runtime status</a></li>
						</ul>
					</details>
				</div>
			</header>
			<main id="main" class="shell-main" tabindex="-1">
				{props.children}
			</main>
			<footer class="site-footer">
				<p>Everything here runs on your computer.</p>
				<ul class="footer-links">
					<li><a href="/library">Library</a></li>
					<li><a href="/library?favorites=1">My List</a></li>
					<li><a href="/library?sort=added">Recently Added</a></li>
					<li><a href="/collections">Collections</a></li>
					<li><a href="/integrations">Integrations</a></li>
					<li><a href="/runtime">Runtime status</a></li>
					<li><a href="/games/new">Add a game</a></li>
				</ul>
				<p class="footer-note">Cairn · local-first game library</p>
			</footer>
		</div>
	)
}
