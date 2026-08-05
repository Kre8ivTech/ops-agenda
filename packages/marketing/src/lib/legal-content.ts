/**
 * Legal page copy — unlike `marketing-content.ts`, this is not ported from
 * the approved mockup (the mockup has no legal pages). Written to describe
 * only what's actually true of this pre-launch marketing site today: it is
 * not a substitute for real legal review once Ops Agenda handles financial
 * or health data.
 */

export const LEGAL_LAST_UPDATED = 'August 4, 2026';

export interface LegalSection {
  heading: string;
  body: string;
}

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: 'What we collect',
    body: 'Right now, the only thing this site collects is the email address you submit to join the waitlist. Nothing else on this site sets a cookie, loads a tracking script, or records how you personally use it.',
  },
  {
    heading: 'How we use it',
    body: "Your email is used for exactly one thing: to write to you when early access opens for the module you're waiting on. We do not send a newsletter, and we do not sell, share, rent, or otherwise disclose it to anyone.",
  },
  {
    heading: 'How it is stored',
    body: 'Waitlist emails are stored in our own AWS account, not with a third-party mailing list provider. Site traffic is logged at the CDN level (CloudFront access logs — timestamp, page, referrer) for basic operational visibility; those logs contain no analytics SDK, no cookies, and are not linked to your waitlist email.',
  },
  {
    heading: 'Your choices',
    body: 'Email info@kre8ivtech.com at any time to be removed from the waitlist. We will delete the record.',
  },
  {
    heading: 'This will change',
    body: 'Once Ops Agenda handles financial or health data, this policy will be rewritten with full legal review to cover that. This version describes only the pre-launch marketing site and its waitlist form.',
  },
];

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: 'What this covers',
    body: 'These terms cover opsagenda.com and its waitlist form only. There is no live product yet — this is a pre-launch marketing site.',
  },
  {
    heading: 'Joining the waitlist',
    body: 'Submitting your email adds you to a list we write to when early access opens. Joining is not a purchase, a subscription, or a commitment on either side.',
  },
  {
    heading: 'No warranty',
    body: 'This site and the waitlist are provided as-is, without warranty of any kind, while the product is still being built.',
  },
  {
    heading: 'Changes',
    body: 'We may change or discontinue this site or the waitlist at any time.',
  },
  {
    heading: 'Full terms at launch',
    body: 'A complete Terms of Service governing the actual product — covering payment, data handling for financial and health information, and liability — will be published before general availability and will require your agreement separately.',
  },
  {
    heading: 'Contact',
    body: 'Questions: info@kre8ivtech.com.',
  },
];
