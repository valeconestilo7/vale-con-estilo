// Cloudflare Pages Function: /callback
// GitHub redirige aquí después del login. Intercambia el código por un token
// y se lo entrega de vuelta al panel de administración (Decap CMS).
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieHeader = request.headers.get('Cookie') || '';
  const savedState = (cookieHeader.match(/oauth_state=([^;]+)/) || [])[1];

  if (!code) {
    return new Response('Falta el código de autorización de GitHub.', { status: 400 });
  }
  if (!state || state !== savedState) {
    return new Response('No se pudo verificar la solicitud de inicio de sesión (state inválido). Intenta de nuevo.', { status: 400 });
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: code,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    return new Response(`Error de autenticación: ${tokenData.error_description || tokenData.error}`, { status: 400 });
  }

  const content = JSON.stringify({ token: tokenData.access_token, provider: 'github' });

  const html = `<!DOCTYPE html>
<html>
<body>
<script>
  (function() {
    function receiveMessage(e) {
      window.opener.postMessage(
        'authorization:github:success:${content}',
        e.origin
      );
      window.removeEventListener("message", receiveMessage, false);
    }
    window.addEventListener("message", receiveMessage, false);
    window.opener.postMessage("authorizing:github", "*");
  })();
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
