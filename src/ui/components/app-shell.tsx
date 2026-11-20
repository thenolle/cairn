/** @jsxImportSource @gambrel/view */
import { FolderOpen, Gauge } from '@gambrel/icons'
import type { Child } from '@gambrel/view'
import { NavLink } from './nav-link.tsx'

export interface AppShellProps {
	readonly pathname: string
	readonly children: Child
}

function isActive(pathname: string, href: string): boolean {
	return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}

export function AppShell(props: AppShellProps): Child {
	return (
		<div class="shell">
			<a class="skip-link" href="#main">
				Skip to content
			</a>
			<nav class="shell-nav" aria-label="Primary">
				<a class="brand" href="/">
					<img src="/assets/favicon.svg" alt="" width="28" height="28" />
					<span>Cairn</span>
				</a>
				<ul class="nav-list">
					<li>
						<NavLink href="/" label="Library" active={isActive(props.pathname, '/')}>
							<FolderOpen size={22} />
						</NavLink>
					</li>
					<li>
						<NavLink href="/runtime" label="Runtime" active={isActive(props.pathname, '/runtime')}>
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
