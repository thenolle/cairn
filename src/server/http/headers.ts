/** Returns a copy of the response whose headers can be changed. */
export function withHeaders(response: Response, mutate: (headers: Headers) => void): Response {
	const copy = new Response(response.body, response)
	mutate(copy.headers)
	return copy
}
