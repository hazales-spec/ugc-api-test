export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Ana sayfa
    if (url.pathname === "/") {
      return new Response(`
        <h1>UGC API Worker</h1>
        <p>TikTok API test backend is running.</p>
        <a href="/login">Login with TikTok</a>
      `, {
        headers: {
          "Content-Type": "text/html; charset=UTF-8",
        },
      });
    }

    // TikTok login başlat
    if (url.pathname === "/login") {
      const state = crypto.randomUUID();

      const redirectUrl = new URL(
        "https://www.tiktok.com/v2/auth/authorize/"
      );

      redirectUrl.searchParams.set("client_key", env.TIKTOK_CLIENT_KEY);
      redirectUrl.searchParams.set("response_type", "code");
      redirectUrl.searchParams.set(
        "scope",
        "user.info.basic,user.info.profile,user.info.stats,video.list"
      );
      redirectUrl.searchParams.set(
        "redirect_uri",
        env.TIKTOK_REDIRECT_URI
      );
      redirectUrl.searchParams.set("state", state);

      return new Response(null, {
        status: 302,
        headers: {
          "Location": redirectUrl.toString(),
          "Set-Cookie": `tiktok_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
        },
      });
    }

    // TikTok callback
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      if (error) {
        return new Response(`TikTok error: ${error}`, {
          status: 400,
        });
      }

      if (!code) {
        return new Response("No authorization code received.", {
          status: 400,
        });
      }

      const cookie = request.headers.get("Cookie") || "";
      const savedState = cookie
        .split("; ")
        .find((row) => row.startsWith("tiktok_oauth_state="))
        ?.split("=")[1];

      if (!state || state !== savedState) {
        return new Response("Invalid OAuth state.", {
          status: 400,
        });
      }

      const body = new URLSearchParams({
        client_key: env.TIKTOK_CLIENT_KEY,
        client_secret: env.TIKTOK_CLIENT_SECRET,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: env.TIKTOK_REDIRECT_URI,
      });

      const tokenResponse = await fetch(
        "https://open.tiktokapis.com/v2/oauth/token/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        }
      );

      const data = await tokenResponse.json();

      if (!tokenResponse.ok) {
        return new Response(
          `<h2>Token error</h2><pre>${JSON.stringify(data, null, 2)}</pre>`,
          {
            status: 500,
            headers: {
              "Content-Type": "text/html; charset=UTF-8",
            },
          }
        );
      }

      return new Response(`
        <h1>🎉 TikTok Login Successful!</h1>
        <p>We received an access token.</p>
        <p><strong>Open ID:</strong> ${data.open_id}</p>
        <p><strong>Scopes:</strong> ${data.scope}</p>
        <p><strong>Token expires in:</strong> ${data.expires_in} seconds</p>
      `, {
        headers: {
          "Content-Type": "text/html; charset=UTF-8",
        },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};
