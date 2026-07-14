import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** iOS / Apple touch icon — same BrandMark language as favicon. */
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
            inset: 0,
            background:
              'radial-gradient(circle at 30% 20%, rgba(56,189,248,0.4), transparent 55%)',
          }}
        />
        <span
          style={{
            position: 'relative',
            color: '#fff',
            fontSize: 88,
            fontWeight: 900,
            fontFamily: 'ui-monospace, Menlo, monospace',
            letterSpacing: '-0.1em',
            lineHeight: 1,
          }}
        >
          B2
        </span>
      </div>
    ),
    { ...size }
  );
}
