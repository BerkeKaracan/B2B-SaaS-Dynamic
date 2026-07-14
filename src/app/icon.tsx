import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

/** Browser tab favicon — matches BrandMark (zinc + sky glow + B2). */
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
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 30% 20%, rgba(56,189,248,0.45), transparent 55%)',
          }}
        />
        <span
          style={{
            position: 'relative',
            color: '#fff',
            fontSize: 15,
            fontWeight: 900,
            fontFamily: 'ui-monospace, Menlo, monospace',
            letterSpacing: '-0.08em',
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
