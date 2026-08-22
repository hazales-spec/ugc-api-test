export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // TikTok login'i başlat
    if (url.pathname === "/auth/tiktok") {
      const state = crypto.randomUUID();

      const authUrl = new URL(
        "https://www.tiktok.com/v2/auth/authorize/"
      );

      authUrl.searchParams.set("client_key", env.TIKTOK_CLIENT_KEY);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "user.info.basic");
      authUrl.searchParams.set(
        "redirect_uri",
        env.TIKTOK_REDIRECT_URI
      );
      authUrl.searchParams.set("state", state);

      return Response.redirect(authUrl.toString(), 302);
    }

    // TikTok login sonrası buraya dönecek
    if (url.pathname === "/auth/tiktok/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      return new Response(
        `TikTok callback received! Code: ${code ? "YES" : "NO"}`,
        { headers: { "content-type": "text/html" } }
      );
    }

    return new Response("UGC API Worker is running!");
  }
};
