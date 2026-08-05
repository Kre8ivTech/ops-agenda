import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#16201b',
        }}
      >
        <div style={{ width: 76, height: 76, borderRadius: 999, backgroundColor: '#25724d', display: 'flex' }} />
      </div>
    ),
    { ...size },
  );
}
