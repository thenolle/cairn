export const pairStyles = `:root { color-scheme: dark light; }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; font: 16px/1.5 system-ui, sans-serif; background: #0e1116; color: #e8ecf1; }
main { max-width: 26rem; padding: 2rem; }
h1 { margin: 0 0 0.5rem; font-size: 1.5rem; }
button { font: inherit; padding: 0.6rem 1.2rem; border: 0; border-radius: 0.5rem; background: #6aa9ff; color: #07101c; cursor: pointer; }
button:focus-visible { outline: 3px solid #ffffff; outline-offset: 2px; }
.error { color: #ff9b9b; }
`

function layout(body: string): string {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<title>Pair with Cairn</title>
<link rel="stylesheet" href="/pair.css">
</head>
<body>
<main>
${body}
</main>
</body>
</html>
`
}

/** Renders the pairing page. `code` must already match the token pattern; it is never user-supplied text. */
export function renderPairPage(code: string | null, error?: string): string {
	const errorBlock = error === undefined ? '' : `<p class="error" role="alert">${error}</p>`
	if (code === null) {
		return layout(`<h1>Pair this browser</h1>
${errorBlock}
<p>This browser is not paired with the Cairn runtime on this computer. Open Cairn with its launcher, which supplies a one-time pairing code.</p>`)
	}
	return layout(`<h1>Pair this browser</h1>
${errorBlock}
<p>Allow this browser to use the Cairn runtime on this computer.</p>
<form method="post" action="/pair">
<input type="hidden" name="code" value="${code}">
<button type="submit">Pair this browser</button>
</form>`)
}
