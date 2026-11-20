/** @jsxImportSource @gambrel/view */
import type { ErrorInfo } from '@gambrel/ssr'
import type { Child } from '@gambrel/view'

export function renderError(info: ErrorInfo): Child {
	return (
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
				<meta name="color-scheme" content="dark light" />
				<title>{`${info.status} ${info.statusText} · Cairn`}</title>
				<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
				<link rel="stylesheet" href="/assets/app.css" />
			</head>
			<body>
				<main class="standalone-page">
					<p class="eyebrow">{String(info.status)}</p>
					<h1>{info.status === 404 ? 'That page does not exist' : info.statusText}</h1>
					{info.message === undefined ? null : <p class="muted">{info.message}</p>}
					<a class="button" href="/">
						Back to your library
					</a>
				</main>
			</body>
		</html>
	)
}
