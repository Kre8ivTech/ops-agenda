import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

export default function Icon() {
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
          borderRadius: 6,
        }}
      >
        <div style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: '#25724d', display: 'flex' }} />
      </div>
    ),
    { ...size },
  );
}
