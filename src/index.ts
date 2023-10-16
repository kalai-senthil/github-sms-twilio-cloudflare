/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http:
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https:
 */

export interface Env {
	GITHUB_SECRET_TOKEN: string;
	TWILIO_ACCOUNT_SID: string;
	TWILIO_AUTH_TOKEN: string;
	MINENUMBR: string;
	TWILIONUMBER: string;
}

import crypto from 'crypto';

async function sendText(accountSid: string, authToken: string, myNumber: string, twilioNumber: string, message: string) {
	const endpoint = 'https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/Messages.json';
	let encoded = new URLSearchParams();
	encoded.append('To', myNumber);
	encoded.append('From', twilioNumber);
	encoded.append('Body', message);

	let token = btoa(accountSid + ':' + authToken);

	const request = {
		body: encoded,
		method: 'POST',
		headers: {
			Authorization: `Basic ${token}`,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	};

	let result = await fetch(endpoint, request);
	result = await result.json();

	return new Response(JSON.stringify(result));
}
async function checkSignature(formData: any, headers: Headers, githubSecretToken: string) {
	let hmac = crypto.createHmac('sha1', githubSecretToken);
	hmac.update(formData, 'utf-8');
	let expectedSignature = hmac.digest('hex');

	let actualSignature = headers.get('X-Hub-Signature') ?? '';

	const expectedBuffer = Buffer.from(expectedSignature, 'hex');
	const actualBuffer = Buffer.from(actualSignature, 'hex');
	return expectedBuffer.byteLength == actualBuffer.byteLength && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const requestMethod = request.method;
		if (requestMethod !== 'POST') {
			return new Response('POST Request only available');
		}
		try {
			const formData = (await request.json()) as { repository: { full_name: string }; sender: { login: string } };
			const headers = request.headers;
			const action = headers.get('x-github-event');
			const repoName = formData.repository.full_name;
			const senderName = formData.sender.login;
			if (!checkSignature(formData, headers, env.GITHUB_SECRET_TOKEN)) {
				return new Response('Wrong password, try again', { status: 403 });
			}
			return await sendText(
				env.TWILIO_ACCOUNT_SID,
				env.TWILIO_AUTH_TOKEN,
				env.MINENUMBR,
				env.TWILIONUMBER,
				`${senderName} completed ${action} onto your repo ${repoName}`
			);
		} catch (error) {
			return new Response(`Error:  ${error}`);
		}
		return new Response('POST Request');
	},
};
