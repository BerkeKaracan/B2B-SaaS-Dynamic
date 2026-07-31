import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/** Favicon — stroke W over soft blocks. */
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
          borderRadius: 8,
          background: 'linear-gradient(145deg, #18181b 0%, #09090b 100%)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #27272a',
        }}
      >
        {/* soft blocks */}
        <div
          style={{
            position: 'absolute',
            left: 4,
            top: 4,
            width: 8,
            height: 6,
            borderRadius: 2,
            background: '#3f3f46',
            opacity: 0.45,
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 4,
            top: 3,
            width: 7,
            height: 7,
            borderRadius: 2,
            background: '#3f3f46',
            opacity: 0.45,
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 6,
            bottom: 7,
            width: 5,
            height: 5,
            borderRadius: 1,
            background: '#38bdf8',
            opacity: 0.7,
          }}
        />
        <span
          style={{
            position: 'relative',
            color: '#fafafa',
            fontSize: 20,
            fontWeight: 800,
            fontFamily: 'Arial, Helvetica, sans-serif',
            lineHeight: 1,
            marginTop: -1,
          }}
        >
          W
        </span>
      </div>
    ),
    { ...size }
  );
}
