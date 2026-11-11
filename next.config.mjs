/** @type {import('next').NextConfig} */
export default {
  // Hide the small "N" badge shown during development. Errors still show up if something breaks.
  devIndicators: false,
  // Lets a phone on the same Wi-Fi open the dev server through this computer's address (e.g. 192.168.1.10).
  // Only affects `next dev`; nothing changes once the app is online.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  // Don't announce which framework runs the site.
  poweredByHeader: false,
  // Security headers on every page and API response.
  headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // No other site may show Mind inside a frame (stops "clickjacking" on buttons like Delete).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          // Browsers must not guess file types.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Other sites only learn that a visitor came from Mind, never which page.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Only the microphone is used (voice), and only by Mind itself.
          { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
};
