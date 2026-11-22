/**
 * 线条插画：黑描边 + 白填充 + 一处奶油黄。
 * 参考图里的图形语言就是这种"画出来的"东西，不是图标字体。
 * 全部手写路径，统一 2.6 描边、圆头圆角。
 */

const S = {
  stroke: "#1a1a18",
  fill: "#ffffff",
  accent: "#fdce02",
  w: 2.6,
} as const;

/** 封面插画：一叠题卡 + 一支铅笔 + 三颗星 */
export function CoverArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 180"
      className={className}
      fill="none"
      role="img"
      aria-label="一叠题卡与一支铅笔"
    >
      {/* 后卡 */}
      <g transform="rotate(7 130 100)">
        <rect x="66" y="40" width="120" height="100" rx="13" fill={S.fill} stroke={S.stroke} strokeWidth={S.w} />
      </g>
      {/* 前卡 */}
      <g transform="rotate(-6 130 100)">
        <rect x="58" y="46" width="120" height="100" rx="13" fill={S.fill} stroke={S.stroke} strokeWidth={S.w} />
        <path d="M76 72h86" stroke={S.stroke} strokeWidth={2.4} strokeLinecap="round" />
        <path d="M76 88h74" stroke={S.stroke} strokeWidth={2.4} strokeLinecap="round" />
        <path d="M76 104h52" stroke={S.stroke} strokeWidth={2.4} strokeLinecap="round" />
        <rect x="76" y="118" width="26" height="14" rx="4" fill={S.accent} stroke={S.stroke} strokeWidth={2.2} />
      </g>
      {/* 铅笔 */}
      <g transform="rotate(34 188 118)">
        <rect x="180" y="60" width="24" height="76" rx="5" fill={S.accent} stroke={S.stroke} strokeWidth={S.w} />
        <path d="M180 136h24l-12 16z" fill={S.fill} stroke={S.stroke} strokeWidth={S.w} strokeLinejoin="round" />
        <path d="M186 152l6-8 6 8" fill={S.stroke} />
        <path d="M180 76h24" stroke={S.stroke} strokeWidth={2.2} />
      </g>
      {/* 星 */}
      <path
        d="M46 34l3.4 8.6L58 46l-8.6 3.4L46 58l-3.4-8.6L34 46l8.6-3.4z"
        fill={S.fill}
        stroke={S.stroke}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      <path
        d="M216 40l2.4 6 6 2.4-6 2.4-2.4 6-2.4-6-6-2.4 6-2.4z"
        fill={S.accent}
        stroke={S.stroke}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <circle cx="228" cy="86" r="3.4" fill={S.fill} stroke={S.stroke} strokeWidth={2} />
    </svg>
  );
}

/** 空态插画：一张空白的卡 + 虚线 + 一点黄 */
export function EmptyArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 120"
      className={className}
      fill="none"
      role="img"
      aria-label="一张空白题卡"
    >
      <g transform="rotate(-5 80 62)">
        <rect x="30" y="22" width="100" height="76" rx="12" fill={S.fill} stroke={S.stroke} strokeWidth={S.w} />
        <path d="M46 46h64" stroke={S.stroke} strokeWidth={2.2} strokeLinecap="round" strokeDasharray="2 7" />
        <path d="M46 62h48" stroke={S.stroke} strokeWidth={2.2} strokeLinecap="round" strokeDasharray="2 7" />
        <rect x="46" y="76" width="22" height="11" rx="3.5" fill={S.accent} stroke={S.stroke} strokeWidth={2} />
      </g>
      <path
        d="M126 24l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"
        fill={S.accent}
        stroke={S.stroke}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 结算插画：一支对勾 + 圆环 */
export function DoneArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" role="img" aria-label="已判分">
      <circle cx="60" cy="60" r="40" fill={S.fill} stroke={S.stroke} strokeWidth={S.w} />
      <path
        d="M42 62l12 12 24-26"
        stroke={S.stroke}
        strokeWidth={4.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M98 22l2.6 6.4 6.4 2.6-6.4 2.6L98 40l-2.6-6.4L89 31l6.4-2.6z"
        fill={S.accent}
        stroke={S.stroke}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  );
}
