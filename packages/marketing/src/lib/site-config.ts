/**
 * Build-time site configuration.
 *
 * `launchState` and `showPricingAmounts` were design-tool props in the approved
 * mockup. The marketing site is a static export with no server, so they are
 * constants resolved at build time rather than runtime state.
 */

export type LaunchState = 'Waitlist' | 'Private beta' | 'Live';

export const LAUNCH_STATE: LaunchState = 'Waitlist';

/** Final pricing has not been set; the plan cards show "Pricing at launch". */
export const SHOW_PRICING_AMOUNTS = false;

const CTA_LABEL: Record<LaunchState, string> = {
  Waitlist: 'Join the waitlist',
  'Private beta': 'Request an invite',
  Live: 'Start free trial',
};

export const CTA_LABEL_TEXT = CTA_LABEL[LAUNCH_STATE];

export const HERO_EYEBROW = LAUNCH_STATE === 'Live' ? 'Available now' : 'Pre-launch · early access';

/**
 * Waitlist intake endpoint, injected at build time. The backing Lambda is not
 * deployed yet — until it is, the form reports that signups are not open rather
 * than showing a success state it cannot honour.
 */
export const WAITLIST_ENDPOINT = process.env.NEXT_PUBLIC_WAITLIST_ENDPOINT ?? '';

export const NAV_ITEMS = [
  { label: 'How it works', href: '/how' },
  { label: 'Modules', href: '/modules' },
  { label: 'Security', href: '/security' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Build status', href: '/changelog' },
] as const;

export const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', href: '/how' },
      { label: 'Modules', href: '/modules' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Build status', href: '/changelog' },
    ],
  },
  {
    title: 'Trust',
    links: [
      { label: 'Security & privacy', href: '/security' },
      { label: "What we won't build", href: '/security#never' },
      { label: 'About', href: '/about' },
    ],
  },
  {
    title: 'Get started',
    links: [
      { label: CTA_LABEL_TEXT, href: '/waitlist' },
      { label: 'Contact', href: '/about' },
    ],
  },
] as const;
