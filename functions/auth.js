// Cloudflare Pages Function: /auth
// Redirige al usuario a GitHub para iniciar el login del panel de administración.
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const clientId = env.GITHUB_CLIENT_ID;
  const redirectUri = `${url.origin}/callback`;
  const state = crypto.randomUUID();

  const githubAuthUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=repo,user` +
    `&state=${encodeURIComponent(state)}`;

  const response = Response.redirect(githubAuthUrl, 302);
  const headers = new Headers(response.headers);
  headers.append('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  return new Response(response.body, { status: response.status, headers });
}
