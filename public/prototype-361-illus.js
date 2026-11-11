/** Coherent 1px stroke line art for the 3.6.1 design study (not production hairline assets). */
const STROKE = {
  ink: "currentColor",
  accent: "var(--proto-accent)",
  muted: "var(--proto-muted-stroke)",
  w: 1,
};

function wrap(id, body) {
  return `<svg class="proto-illus proto-illus--${id}" viewBox="0 0 160 120" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

export const illustrations = {
  morning: wrap(
    "morning",
    `<g stroke="${STROKE.ink}" stroke-width="${STROKE.w}" vector-effect="non-scaling-stroke">
      <path d="M80 28c-14 0-26 11-26 26 0 8 3 15 8 20"/>
      <path d="M80 28c14 0 26 11 26 26"/>
      <path d="M44 78h72"/>
      <path d="M56 88h48"/>
      <path d="M68 98h24"/>
    </g>
    <g stroke="${STROKE.accent}" stroke-width="${STROKE.w}" vector-effect="non-scaling-stroke">
      <circle cx="118" cy="36" r="10"/>
      <path d="M118 30v12M112 36h12"/>
    </g>
    <g stroke="${STROKE.muted}" stroke-width="${STROKE.w}" stroke-dasharray="3 4" vector-effect="non-scaling-stroke">
      <path d="M28 52l8 6M132 58l-8 6"/>
    </g>`
  ),
  evening: wrap(
    "evening",
    `<g stroke="${STROKE.ink}" stroke-width="${STROKE.w}" vector-effect="non-scaling-stroke">
      <path d="M52 70a28 28 0 0 1 56 0"/>
      <path d="M36 70h88"/>
      <path d="M64 82c4 6 10 10 16 10s12-4 16-10"/>
    </g>
    <g stroke="${STROKE.accent}" stroke-width="${STROKE.w}" vector-effect="non-scaling-stroke">
      <path d="M108 34l4 10 10 2-8 7 2 10-8-6-8 6 2-10-8-7 10-2z"/>
    </g>
    <g stroke="${STROKE.muted}" stroke-width="${STROKE.w}" vector-effect="non-scaling-stroke">
      <circle cx="42" cy="38" r="2" fill="currentColor"/>
      <circle cx="54" cy="28" r="1.5" fill="currentColor"/>
      <circle cx="30" cy="48" r="1.5" fill="currentColor"/>
    </g>`
  ),
  allDone: wrap(
    "all-done",
    `<g stroke="${STROKE.ink}" stroke-width="${STROKE.w}" vector-effect="non-scaling-stroke">
      <rect x="44" y="32" width="72" height="56" rx="10"/>
      <path d="M60 60l12 12 28-28"/>
    </g>
    <g stroke="${STROKE.accent}" stroke-width="${STROKE.w}" vector-effect="non-scaling-stroke">
      <path d="M118 44l6 6-14 14-8-8"/>
    </g>`
  ),
  emptyPhotos: wrap(
    "empty-photos",
    `<g stroke="${STROKE.ink}" stroke-width="${STROKE.w}" vector-effect="non-scaling-stroke">
      <rect x="38" y="28" width="84" height="64" rx="8"/>
      <circle cx="58" cy="48" r="8"/>
      <path d="M38 76l22-18 18 14 16-12 28 16"/>
    </g>
    <g stroke="${STROKE.muted}" stroke-width="${STROKE.w}" stroke-dasharray="4 5" vector-effect="non-scaling-stroke">
      <path d="M72 44h32M72 56h24"/>
    </g>`
  ),
  firstWeek: wrap(
    "first-week",
    `<g stroke="${STROKE.ink}" stroke-width="${STROKE.w}" vector-effect="non-scaling-stroke">
      <rect x="36" y="30" width="88" height="60" rx="8"/>
      <path d="M36 46h88"/>
      <path d="M52 30v60M68 30v60M84 30v60M100 30v60M116 30v60"/>
    </g>
    <g stroke="${STROKE.accent}" stroke-width="${STROKE.w}" vector-effect="non-scaling-stroke">
      <circle cx="52" cy="58" r="4"/>
      <circle cx="68" cy="66" r="4"/>
      <circle cx="84" cy="54" r="4"/>
    </g>`
  ),
  focus: wrap(
    "focus",
    `<g stroke="${STROKE.ink}" stroke-width="${STROKE.w}" vector-effect="non-scaling-stroke">
      <circle cx="80" cy="60" r="32"/>
      <path d="M80 60V44"/>
      <path d="M80 60l14 8"/>
    </g>
    <g stroke="${STROKE.accent}" stroke-width="${STROKE.w}" vector-effect="non-scaling-stroke">
      <path d="M118 38h12v12h-12z"/>
      <path d="M30 78h18M30 86h12"/>
    </g>`
  ),
  reflection: wrap(
    "reflection",
    `<g stroke="${STROKE.ink}" stroke-width="${STROKE.w}" vector-effect="non-scaling-stroke">
      <path d="M48 28h52l20 20v44a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8V36a8 8 0 0 1 8-8z"/>
      <path d="M100 28v20h20"/>
    </g>
    <g stroke="${STROKE.muted}" stroke-width="${STROKE.w}" stroke-dasharray="3 4" vector-effect="non-scaling-stroke">
      <path d="M52 58h44M52 72h36M52 86h28"/>
    </g>
    <g stroke="${STROKE.accent}" stroke-width="${STROKE.w}" vector-effect="non-scaling-stroke">
      <path d="M108 70c0 6-4 10-10 10s-10-4-10-10 4-10 10-10 10 4 10 10z"/>
      <path d="M98 70h4M100 68v4"/>
    </g>`
  ),
  calendarInsight: wrap(
    "calendar-insight",
    `<g stroke="${STROKE.ink}" stroke-width="${STROKE.w}" vector-effect="non-scaling-stroke">
      <rect x="44" y="26" width="72" height="68" rx="10"/>
      <path d="M44 42h72"/>
      <path d="M60 26v16M100 26v16"/>
    </g>
    <g stroke="${STROKE.accent}" stroke-width="${STROKE.w}" vector-effect="non-scaling-stroke">
      <path d="M58 58h10v10H58zM74 58h10v10H74zM90 58h10v10H90z"/>
      <path d="M58 74h10v10H58zM74 74h10v10H74z"/>
    </g>
    <g stroke="${STROKE.muted}" stroke-width="${STROKE.w}" vector-effect="non-scaling-stroke">
      <path d="M118 52l8 8-8 8"/>
    </g>`
  ),
};
