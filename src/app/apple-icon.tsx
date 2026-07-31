import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Apple touch icon — stroke W over soft blocks. */
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
          borderRadius: 40,
          background: 'linear-gradient(145deg, #18181b 0%, #09090b 100%)',
          position: 'relative',
          overflow: 'hidden',
          border: '3px solid #27272a',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 28,
            top: 30,
            width: 44,
            height: 34,
            borderRadius: 10,
            background: '#3f3f46',
            opacity: 0.45,
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 28,
            top: 26,
            width: 40,
            height: 40,
            borderRadius: 10,
            background: '#3f3f46',
            opacity: 0.45,
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 36,
            bottom: 40,
            width: 28,
            height: 28,
            borderRadius: 8,
            background: '#38bdf8',
            opacity: 0.7,
          }}
        />
        <span
          style={{
            position: 'relative',
            color: '#fafafa',
            fontSize: 108,
            fontWeight: 800,
            fontFamily: 'Arial, Helvetica, sans-serif',
            lineHeight: 1,
          }}
        >
          W
        </span>
      </div>
    ),
    { ...size }
  );
}
