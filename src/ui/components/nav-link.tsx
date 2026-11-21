/** @jsxImportSource @gambrel/view */
import type { Child } from '@gambrel/view'

export interface NavLinkProps {
	readonly href: string
	readonly label: string
	readonly active: boolean
}

export function NavLink(props: NavLinkProps): Child {
	return props.active ? (
		<a class="topnav-link" href={props.href} aria-current="page">
			{props.label}
		</a>
	) : (
		<a class="topnav-link" href={props.href}>
			{props.label}
		</a>
	)
}
