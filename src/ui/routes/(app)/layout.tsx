/** @jsxImportSource @gambrel/view */
import type { LayoutProps, LoaderData, RouteParams } from '@gambrel/router'
import type { Child } from '@gambrel/view'
import { AppShell } from '../../components/app-shell.tsx'
import type { loader } from './layout.server.ts'

export default function ShellLayout(props: LayoutProps<RouteParams, LoaderData<typeof loader>>): Child {
	return (
		<AppShell pathname={props.data.pathname} search={props.data.search}>
			{props.children}
		</AppShell>
	)
}
