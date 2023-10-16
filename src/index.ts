/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http:
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https:
 */

export interface Env {}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const requestMethod = request.method;
		if (requestMethod !== 'POST') {
			return new Response('POST Request only available');
		}
		try {
			const formData = request.json();
			console.log(formData);
		} catch (error) {}
		return new Response('POST Request');
	},
};
