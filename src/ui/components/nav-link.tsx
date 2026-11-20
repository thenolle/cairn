/** @jsxImportSource @gambrel/view */
import type { Child } from '@gambrel/view'

export interface NavLinkProps {
	readonly href: string
	readonly label: string
	readonly active: boolean
	readonly children: Child
}

export function NavLink(props: NavLinkProps): Child {
	return props.active ? (
		<a class="nav-link" href={props.href} aria-current="page">
			{props.children}
			<span>{props.label}</span>
		</a>
	) : (
		<a class="nav-link" href={props.href}>
			{props.children}
			<span>{props.label}</span>
		</a>
	)
}
