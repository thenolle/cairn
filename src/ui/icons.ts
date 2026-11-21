import { createIcon } from '@gambrel/icons'

export const SearchIcon = createIcon('search-glass', [
	['circle', { cx: '11', cy: '11', r: '7' }],
	['line', { x1: '16.5', y1: '16.5', x2: '21', y2: '21' }]
])

export const ChevronLeftIcon = createIcon('chevron-left-thin', [['polyline', { points: '15 5 8 12 15 19' }]])

export const ChevronRightIcon = createIcon('chevron-right-thin', [['polyline', { points: '9 5 16 12 9 19' }]])
