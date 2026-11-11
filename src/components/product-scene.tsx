type Props = { kind?: "coffee" | "water" | "both"; className?: string };

export default function ProductScene({ kind = "both", className = "" }: Props) {
  if (kind === "water") {
    return (
      <svg
        className={className}
        viewBox="0 0 700 570"
        fill="none"
        role="img"
        aria-label="Aparat de apă Vero Aqua"
      >
        <image
          className="water-dispenser-float"
          href="/images/vero-aqua-dispenser-black.webp"
          x="190"
          y="24"
          width="320"
          height="470"
          preserveAspectRatio="xMidYMid meet"
        />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 700 570"
      fill="none"
      role="img"
      aria-label={
        kind === "both"
          ? "Espressor și aparat de apă Makeon pe podiumuri verzi"
          : kind === "coffee"
            ? "Espressor profesional Makeon"
            : "Aparat de apă filtrată Makeon"
      }
    >
      <defs>
        <linearGradient id={`metal-${kind}`} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#b4b6b0" />
          <stop offset=".17" stopColor="#f5f5ef" />
          <stop offset=".55" stopColor="#d5d7d0" />
          <stop offset=".8" stopColor="#fafaf5" />
          <stop offset="1" stopColor="#969c94" />
        </linearGradient>
        <linearGradient id={`dark-${kind}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#454b43" />
          <stop offset=".45" stopColor="#1d251f" />
          <stop offset="1" stopColor="#090e0c" />
        </linearGradient>
        <linearGradient id={`podium-${kind}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#bbc6a2" />
          <stop offset="1" stopColor="#7c8f6a" />
        </linearGradient>
        <linearGradient id={`glass-${kind}`} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#e8efe4" stopOpacity=".75" />
          <stop offset=".35" stopColor="#b9d1c7" stopOpacity=".25" />
          <stop offset=".8" stopColor="#f8fcf5" stopOpacity=".8" />
          <stop offset="1" stopColor="#8daa9c" stopOpacity=".6" />
        </linearGradient>
        <filter id={`shadow-${kind}`}>
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>
      {kind === "both" && (
        <>
          <ellipse
            cx="388"
            cy="493"
            rx="270"
            ry="30"
            fill="#344434"
            opacity=".15"
            filter={`url(#shadow-${kind})`}
          />
          <path d="M330 340L587 340L657 390L398 390Z" fill="#c9d2b4" />
          <path d="M398 390H657V506H398Z" fill={`url(#podium-${kind})`} />
          <path d="M330 340L398 390V506L330 456Z" fill="#8a9c77" />
          <path d="M55 416L332 416L404 465L126 465Z" fill="#ccd5b9" />
          <path d="M126 465H404V570H126Z" fill={`url(#podium-${kind})`} />
          <path d="M55 416L126 465V570L55 519Z" fill="#a3b38e" />
        </>
      )}
      {kind !== "coffee" && (
        <g
          className="water-machine"
          transform={
            kind === "both"
              ? "translate(381 17)"
              : "translate(228 40) scale(1.2)"
          }
        >
          <ellipse
            cx="95"
            cy="338"
            rx="86"
            ry="13"
            fill="#1b3122"
            opacity=".18"
          />
          <path
            d="M12 39L138 17L171 39V317L143 342L12 329Z"
            fill={`url(#metal-${kind})`}
          />
          <path d="M138 17L171 39V317L143 342V47Z" fill="#aaaFA5" />
          <path d="M12 39L138 17L143 47L16 62Z" fill="#edefe7" />
          <path d="M19 62L138 48V187L19 194Z" fill={`url(#dark-${kind})`} />
          <path d="M19 194L138 187V307L19 309Z" fill="#48524b" />
          <path d="M35 206L123 202V294L35 295Z" fill="#171f1a" />
          <rect x="45" y="76" width="69" height="37" rx="3" fill="#151e19" />
          <text
            x="80"
            y="95"
            textAnchor="middle"
            fill="#d8e2d0"
            fontSize="10"
            fontFamily="Arial"
            letterSpacing="2"
          >
            makeon
          </text>
          <circle cx="58" cy="145" r="7" fill="#cbd7c7" />
          <circle cx="80" cy="143" r="7" fill="#a1bfae" />
          <circle cx="102" cy="140" r="7" fill="#768f80" />
          <path d="M77 180V211H88V179" fill="#cdd1c9" />
          <path
            d="M61 236L65 285Q79 294 94 283L98 234Z"
            fill={`url(#glass-${kind})`}
            stroke="#c2d3c5"
          />
          <ellipse cx="79" cy="236" rx="18" ry="4" stroke="#d6e2d3" />
          <path
            d="M65 255Q80 260 95 254L93 281Q78 290 68 281Z"
            fill="#b3d6c9"
            opacity=".6"
          />
          <path d="M29 307L132 302L136 316L25 320Z" fill="#737f74" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <path key={i} d={`M${36 + i * 12} 307l-1 9`} stroke="#303b31" />
          ))}
          <text
            x="81"
            y="332"
            textAnchor="middle"
            fill="#435444"
            fontSize="6"
            fontFamily="Arial"
            letterSpacing="2"
          >
            WATER COLLECTION
          </text>
        </g>
      )}
      {(
        <g
          className="coffee-machine"
          transform={
            kind === "both"
              ? "translate(107 126)"
              : "translate(170 72) scale(1.3)"
          }
        >
          <ellipse
            cx="126"
            cy="304"
            rx="115"
            ry="17"
            fill="#17281a"
            opacity=".2"
          />
          <path
            d="M20 41L195 26L225 51V285L202 308L20 292Z"
            fill={`url(#metal-${kind})`}
          />
          <path d="M195 26L225 51V285L202 308V59Z" fill="#747c72" />
          <path d="M20 41L195 26L202 59L26 72Z" fill="#f0f1e9" />
          <path d="M26 72L202 59V172L26 184Z" fill={`url(#dark-${kind})`} />
          <path d="M29 71L201 59V89L29 101Z" fill="#303830" />
          <rect
            x="79"
            y="111"
            width="70"
            height="42"
            rx="4"
            fill="#070e0a"
            transform="rotate(-4 79 111)"
          />
          <text
            x="114"
            y="128"
            textAnchor="middle"
            fill="#dfe8d4"
            fontSize="11"
            fontFamily="Arial"
            letterSpacing="2"
          >
            makeon
          </text>
          <rect x="99" y="136" width="27" height="3" rx="1" fill="#a9bd8c" />
          <circle cx="52" cy="139" r="9" stroke="#a6ac9f" strokeWidth="2" />
          <circle cx="177" cy="130" r="9" stroke="#a6ac9f" strokeWidth="2" />
          <path d="M31 187L195 175V271L31 281Z" fill="#333e34" />
          <path d="M65 187L162 180V259L65 265Z" fill="#121b15" />
          <path d="M91 172L143 168V190L91 194Z" fill="#889286" />
          <path d="M103 190V208H112V190M128 189V207H137V189" fill="#c7cebf" />
          <path d="M92 229H143L138 261Q117 273 98 262Z" fill="#f1f0df" />
          <ellipse cx="117" cy="229" rx="25" ry="6" fill="#d1cbbc" />
          <ellipse cx="117" cy="230" rx="21" ry="4" fill="#66412a" />
          <path
            d="M142 235C161 229 162 251 140 252"
            stroke="#efedde"
            strokeWidth="7"
          />
          <path d="M33 280L195 269L200 284L30 295Z" fill="#959e8e" />
          {Array.from({ length: 12 }, (_, i) => (
            <path
              key={i}
              d={`M${43 + i * 12} ${281 - i * 0.7}l-3 9`}
              stroke="#394438"
              strokeWidth="2"
            />
          ))}
          <path
            d="M38 37L44 2Q98 -9 160 -2L174 28"
            fill="#252d23"
            opacity=".9"
          />
          <path d="M45 3Q101 -6 158 -1L158 9Q101 4 46 13Z" fill="#4c4333" />
          <text
            x="113"
            y="304"
            textAnchor="middle"
            fill="#40513c"
            fontSize="6"
            fontFamily="Arial"
            letterSpacing="2"
          >
            COFFEE COLLECTION
          </text>
        </g>
      )}
      {kind === "both" && (
        <g transform="translate(447 400)">
          <path
            d="M0 3L5 57Q27 69 50 55L55 0Z"
            fill={`url(#glass-${kind})`}
            stroke="#dce5d1"
            strokeWidth="2"
          />
          <ellipse
            cx="27"
            cy="3"
            rx="27"
            ry="6"
            stroke="#e6ecdb"
            strokeWidth="2"
          />
          <path
            d="M4 24Q26 30 52 22L48 53Q27 64 8 54Z"
            fill="#c2d9be"
            opacity=".6"
          />
        </g>
      )}
    </svg>
  );
}
