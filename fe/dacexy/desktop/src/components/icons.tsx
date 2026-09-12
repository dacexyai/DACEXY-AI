type P = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  width: "100%",
  height: "100%",
};

export const IconChat = (p: P) => (
  <svg {...base} {...p}>
    <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-6.5A8 8 0 0 1 11 4h2a8 8 0 0 1 8 8Z" />
  </svg>
);
export const IconGrid = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.6" />
    <rect x="14" y="3" width="7" height="7" rx="1.6" />
    <rect x="3" y="14" width="7" height="7" rx="1.6" />
    <rect x="14" y="14" width="7" height="7" rx="1.6" />
  </svg>
);
export const IconGear = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06A2 2 0 1 1 4.17 16.9l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06A2 2 0 1 1 7.08 4.14l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" />
  </svg>
);
export const IconInfo = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);
export const IconFolder = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h9A1.5 1.5 0 0 1 21 10v7.5A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5Z" />
  </svg>
);
export const IconMail = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.2" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </svg>
);
export const IconChart = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 19V11M12 19V5M18 19v-6" />
  </svg>
);
export const IconBroom = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4 20h16M6 20l1-6h10l1 6M9 14V6a3 3 0 0 1 6 0v8" />
  </svg>
);
export const IconMic = (p: P) => (
  <svg {...base} {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);
export const IconArrowUp = (p: P) => (
  <svg {...base} {...p} strokeWidth={2}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);
export const IconPlus = (p: P) => (
  <svg {...base} {...p} strokeWidth={2}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconArrowRight = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const IconChevron = (p: P) => (
  <svg {...base} {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const IconSearch = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
);
export const IconBell = (p: P) => (
  <svg {...base} {...p}>
    <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
    <path d="M10.5 19a2 2 0 0 0 3 0" />
  </svg>
);
export const IconBranch = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="6" cy="5" r="2" />
    <circle cx="6" cy="19" r="2" />
    <circle cx="18" cy="9" r="2" />
    <path d="M6 7v10M18 11c0 4-4 3-6 6" />
  </svg>
);
export const IconClock = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.2l3.2 2" />
  </svg>
);
export const IconPlug = (p: P) => (
  <svg {...base} {...p}>
    <path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0Z" />
    <path d="M12 17v4" />
  </svg>
);
export const IconDownload = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 4v10M8 10.5l4 4 4-4M4 19h16" />
  </svg>
);
export const IconCheck = (p: P) => (
  <svg {...base} {...p} strokeWidth={2}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
);
export const IconShield = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3.5 5 6.2v5.1c0 4.5 3 7.7 7 9.2 4-1.5 7-4.7 7-9.2V6.2Z" />
  </svg>
);
export const IconBolt = (p: P) => (
  <svg {...base} {...p}>
    <path d="M13 3 5 14h6l-1 7 8-11h-6Z" />
  </svg>
);
export const IconSidebar = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2.4" />
    <path d="M9.5 4v16" />
  </svg>
);
export const IconHelp = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.6 9.4a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.4M12 17h.01" />
  </svg>
);
export const IconCode = (p: P) => (
  <svg {...base} {...p}>
    <path d="m9 8-5 4 5 4M15 8l5 4-5 4" />
  </svg>
);
export const IconSpark = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3.5 13.9 9 19.5 11 13.9 13 12 18.5 10.1 13 4.5 11 10.1 9Z" />
  </svg>
);
export const IconWindow = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2.4" />
    <path d="M3 9h18" />
  </svg>
);
