import { ImageResponse } from 'next/og';

export const alt = "Ops Agenda — It watches the things you'd only notice too late.";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#16201b',
          padding: '72px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: '#25724d', display: 'flex' }} />
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', color: '#f7f7f2', display: 'flex' }}>
            Ops Agenda
          </div>
        </div>
        <div
          style={{
            fontSize: 58,
            fontWeight: 800,
            lineHeight: 1.12,
            letterSpacing: '-0.03em',
            color: '#f7f7f2',
            maxWidth: '920px',
            display: 'flex',
          }}
        >
          It watches the things you&rsquo;d only notice too late.
        </div>
        <div
          style={{
            fontSize: 24,
            lineHeight: 1.5,
            color: 'rgba(247,247,242,0.72)',
            maxWidth: '820px',
            display: 'flex',
          }}
        >
          Reads what you already use, ranks your day by what is genuinely at risk, and hands you one
          agenda at 6:00 every morning.
        </div>
      </div>
    ),
    { ...size },
  );
}
