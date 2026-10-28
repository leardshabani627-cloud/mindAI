// The landscape behind every page: pale sky, misty blue mountains, clouds and rolling green hills.
// Drawn as SVG (no photo needed); dark mode dims it with a CSS filter (see .scenery in globals.css).
//
// Prefer a real photo? Put one you have the rights to in /public (e.g. public/background.jpg)
// and set NEXT_PUBLIC_BACKGROUND_IMAGE=/background.jpg in .env.local.
const PHOTO = process.env.NEXT_PUBLIC_BACKGROUND_IMAGE;

const HILLS = [
  { d: "M0 530 C 160 490 330 486 520 518 C 700 550 860 532 1040 502 C 1220 472 1420 490 1600 510 V1000 H0 Z", top: "#cbdab7", bottom: "#8ea878" },
  { d: "M0 622 C 180 572 380 562 560 598 C 760 638 900 662 1080 612 C 1260 562 1440 572 1600 592 V1000 H0 Z", top: "#bccfa3", bottom: "#7a9a64" },
  { d: "M0 730 C 220 662 420 652 640 692 C 860 732 1000 762 1200 712 C 1380 668 1500 672 1600 686 V1000 H0 Z", top: "#adc591", bottom: "#698d54" },
  { d: "M0 826 C 260 776 500 766 760 816 C 980 860 1180 856 1380 806 C 1480 782 1560 782 1600 788 V1000 H0 Z", top: "#9fba80", bottom: "#5b8048" },
  { d: "M0 930 C 300 880 600 870 900 914 C 1150 950 1400 940 1600 910 V1000 H0 Z", top: "#91af71", bottom: "#4e733e" },
];

const crest = (d: string) => d.split(" V")[0];

/** Full-screen behind every page, or `contained` to fill a panel (the sign-in showcase). */
export default function Scenery({ contained = false }: { contained?: boolean }) {
  return (
    <div
      aria-hidden
      className={`scenery pointer-events-none overflow-hidden ${contained ? "absolute inset-0" : "fixed inset-0 -z-10"}`}
    >
      <svg className="h-full w-full" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f5f6f8" />
            <stop offset="0.45" stopColor="#f0f2f4" />
            <stop offset="0.62" stopColor="#e6ebe7" />
          </linearGradient>
          <linearGradient id="mountain" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8fa6bc" />
            <stop offset="1" stopColor="#d3dee6" />
          </linearGradient>
          <linearGradient id="mountainFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b8c8d6" />
            <stop offset="1" stopColor="#e4eaee" />
          </linearGradient>
          {HILLS.map((h, i) => (
            <linearGradient key={i} id={`hill${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={h.top} />
              <stop offset="0.6" stopColor={h.bottom} />
              <stop offset="1" stopColor={h.bottom} />
            </linearGradient>
          ))}
          <filter id="cloud" x="-30%" y="-80%" width="160%" height="260%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <filter id="haze">
            <feGaussianBlur stdDeviation="2" />
          </filter>
          <filter id="crest" x="-5%" y="-50%" width="110%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        <rect width="1600" height="1000" fill="url(#sky)" />

        {/* distant mountains, half hidden in cloud */}
        <path
          filter="url(#haze)"
          fill="url(#mountainFar)"
          d="M640 530 C 720 500 780 470 860 478 C 930 486 980 440 1040 452 C 1100 464 1150 500 1220 506 V580 H640 Z"
        />
        <path
          filter="url(#haze)"
          fill="url(#mountain)"
          d="M960 530 C 1020 500 1060 470 1120 452 C 1170 438 1200 400 1260 392 C 1320 384 1350 430 1400 426 C 1460 420 1500 380 1560 392 C 1580 396 1600 404 1600 404 V600 H960 Z"
        />

        <g filter="url(#cloud)" fill="#ffffff">
          <ellipse cx="1180" cy="430" rx="130" ry="34" opacity="0.95" />
          <ellipse cx="1420" cy="470" rx="190" ry="44" opacity="0.95" />
          <ellipse cx="1030" cy="500" rx="170" ry="30" opacity="0.9" />
          <ellipse cx="1300" cy="520" rx="260" ry="36" opacity="0.9" />
          <ellipse cx="1560" cy="380" rx="120" ry="40" opacity="0.85" />
          <ellipse cx="300" cy="420" rx="320" ry="40" opacity="0.6" />
          <ellipse cx="760" cy="540" rx="520" ry="28" opacity="0.75" />
        </g>

        {HILLS.map((h, i) => (
          <g key={i}>
            <path d={h.d} fill={`url(#hill${i})`} />
            {/* soft light along the crest */}
            <path d={crest(h.d)} fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="4" filter="url(#crest)" />
            {/* combed grass: copies of the crest line, drifting down the slope (the next hill covers the rest) */}
            <g fill="none" strokeLinecap="round">
              {[10, 22, 36, 52, 70, 90, 112].map((dy, k) => (
                <path
                  key={dy}
                  d={crest(h.d)}
                  transform={`translate(0 ${dy})`}
                  stroke={k % 2 ? "#2f4f22" : "#ffffff"}
                  strokeOpacity={k % 2 ? 0.07 : 0.12}
                  strokeWidth="1.4"
                />
              ))}
            </g>
          </g>
        ))}

        {/* morning mist in the valley */}
        <g filter="url(#cloud)" fill="#ffffff">
          <ellipse cx="520" cy="640" rx="420" ry="18" opacity="0.35" />
          <ellipse cx="1280" cy="610" rx="360" ry="16" opacity="0.35" />
        </g>
      </svg>

      {PHOTO && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={PHOTO} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
    </div>
  );
}
