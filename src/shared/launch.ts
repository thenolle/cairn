export type LaunchOutcome =
	| 'started'
	| 'not_found'
	| 'not_installed'
	| 'unsupported'
	| 'unavailable'
	| 'no_emulator'
	| 'busy'
	| 'failed'

export const launchMessages: Readonly<Record<LaunchOutcome, string>> = {
	started: 'Launch requested. The game starts in its launcher or emulator.',
	not_found: 'That game no longer exists.',
	not_installed: 'This game is not installed.',
	unsupported: 'Launching is not available for this game yet.',
	unavailable: 'Cairn could not find what it needs to start this game. Scan the integration again.',
	no_emulator: 'Choose an emulator for this platform on the Integrations page.',
	busy: 'A launch was just requested. Give it a moment.',
	failed: 'The launch request failed.'
}

export function isLaunchOutcome(value: string): value is LaunchOutcome {
	return Object.hasOwn(launchMessages, value)
}
