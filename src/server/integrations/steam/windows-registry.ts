/** Reads Steam's install folder from the Windows registry, or null when it cannot be read. */
export async function readSteamRegistryPath(): Promise<string | null> {
	try {
		const child = Bun.spawn(['reg', 'query', 'HKCU\\Software\\Valve\\Steam', '/v', 'SteamPath'], {
			stdin: 'ignore',
			stdout: 'pipe',
			stderr: 'ignore'
		})
		const output = await new Response(child.stdout).text()
		if ((await child.exited) !== 0) return null
		return /SteamPath\s+REG_SZ\s+(.+)/u.exec(output)?.[1]?.trim() ?? null
	} catch {
		return null
	}
}
