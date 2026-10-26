import type { Companion } from "@/prompts/companions";

// A soft, illustrated portrait for a companion. Clearly a drawing, not a photo of a real person.
export default function Avatar({ look, className = "" }: { look: Companion["look"]; className?: string }) {
  const { skin, hair, hairStyle, top } = look;
  const shade = "rgba(0,0,0,0.12)";

  return (
    <svg viewBox="0 0 160 180" className={className} aria-hidden>
      {/* hair behind the head */}
      {hairStyle === "long" && (
        <path d="M42 82 C 36 40 60 30 80 30 C 100 30 124 40 118 82 L 124 140 C 110 136 100 128 96 116 L 64 116 C 60 128 50 136 36 140 Z" fill={hair} />
      )}
      {hairStyle === "bun" && <circle cx="80" cy="30" r="15" fill={hair} />}

      {/* shoulders and neck */}
      <path d="M18 180 C 22 138 52 122 80 122 C 108 122 138 138 142 180 Z" fill={top} />
      <path d="M58 132 C 66 140 94 140 102 132" fill="none" stroke={shade} strokeWidth="3" strokeLinecap="round" />
      <rect x="68" y="98" width="24" height="32" rx="11" fill={skin} />
      <rect x="68" y="104" width="24" height="10" fill={shade} />

      {/* head and ears */}
      <circle cx="49" cy="82" r="7" fill={skin} />
      <circle cx="111" cy="82" r="7" fill={skin} />
      <ellipse cx="80" cy="78" rx="31" ry="37" fill={skin} />

      {/* a calm, simple face */}
      <path d="M66 80 q4 -4 8 0 M86 80 q4 -4 8 0" fill="none" stroke="#3b2a22" strokeOpacity="0.55" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M72 96 q8 6 16 0" fill="none" stroke="#8a4a3a" strokeOpacity="0.55" strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cx="64" cy="90" rx="5" ry="3" fill="#e88a7a" opacity="0.18" />
      <ellipse cx="96" cy="90" rx="5" ry="3" fill="#e88a7a" opacity="0.18" />

      {/* hair in front */}
      {hairStyle === "long" && <path d="M48 72 C 50 46 68 38 82 38 C 100 38 114 50 112 72 C 98 60 80 56 62 64 C 56 66 52 69 48 72 Z" fill={hair} />}
      {hairStyle === "short" && <path d="M47 76 C 44 46 62 36 80 36 C 99 36 117 46 113 76 C 108 62 98 54 80 54 C 64 54 53 62 47 76 Z" fill={hair} />}
      {hairStyle === "bun" && <path d="M48 74 C 47 50 63 40 80 40 C 98 40 113 50 112 74 C 104 58 92 52 80 52 C 66 52 55 60 48 74 Z" fill={hair} />}
      {hairStyle === "curly" && (
        <g fill={hair}>
          {[[52, 62, 12], [62, 48, 13], [78, 42, 14], [95, 47, 13], [107, 60, 12], [48, 76, 8], [112, 75, 8]].map(([cx, cy, r]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      )}
    </svg>
  );
}
