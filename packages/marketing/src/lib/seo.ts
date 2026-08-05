import type { Metadata } from 'next';

const SITE_NAME = 'Ops Agenda';

interface PageMetadataInput {
  /** Short page title, e.g. "About" — the layout's `title.template` appends " — Ops Agenda" for the `<title>` tag. Omit to fall back to the layout's default title (e.g. the home page). */
  title?: string;
  /** Full title for Open Graph/Twitter previews, which don't go through the title template. Defaults to `${title} — Ops Agenda` when `title` is set. */
  ogTitle?: string;
  description: string;
  /** Route path, e.g. "/about" or "/" — resolved against `metadataBase`. */
  path: string;
}

export function pageMetadata({ title, ogTitle, description, path }: PageMetadataInput): Metadata {
  const resolvedOgTitle = ogTitle ?? (title ? `${title} — ${SITE_NAME}` : undefined);

  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      ...(resolvedOgTitle ? { title: resolvedOgTitle } : {}),
      description,
      url: path,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      ...(resolvedOgTitle ? { title: resolvedOgTitle } : {}),
      description,
    },
  };
}
