import { ImageResponse } from 'next/og';
import { BRAND_NAME, BRAND_TAGLINE } from '@/lib/brand';

export const alt = BRAND_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Default Open Graph / social share card — W mark + WORKSPACE OS wordmark. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background:
            'linear-gradient(145deg, #F7F9FB 0%, #EEF6FB 45%, #E8F5F0 100%)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -120,
            left: -80,
            width: 420,
            height: 420,
            borderRadius: 999,
            background:
              'radial-gradient(circle, rgba(125,211,252,0.45) 0%, transparent 68%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -140,
            right: -60,
            width: 380,
            height: 380,
            borderRadius: 999,
            background:
              'radial-gradient(circle, rgba(110,231,183,0.35) 0%, transparent 68%)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'linear-gradient(145deg, #18181b 0%, #09090b 100%)',
              border: '1px solid #27272a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 8,
                top: 8,
                width: 14,
                height: 10,
                borderRadius: 3,
                background: '#3f3f46',
                opacity: 0.5,
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: 8,
                top: 7,
                width: 12,
                height: 12,
                borderRadius: 3,
                background: '#3f3f46',
                opacity: 0.5,
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: 10,
                bottom: 12,
                width: 10,
                height: 10,
                borderRadius: 2,
                background: '#38bdf8',
                opacity: 0.75,
              }}
            />
            <span
              style={{
                position: 'relative',
                color: '#fafafa',
                fontSize: 32,
                fontWeight: 800,
                fontFamily: 'Arial, Helvetica, sans-serif',
                lineHeight: 1,
              }}
            >
              W
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: '#09090b',
                letterSpacing: '-0.03em',
              }}
            >
              WORKSPACE{' '}
              <span style={{ color: '#0284c7' }}>OS</span>
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#71717a',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              {BRAND_TAGLINE}
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            maxWidth: 920,
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: '#09090b',
              letterSpacing: '-0.04em',
              lineHeight: 1.08,
            }}
          >
            The operating system for your company.
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: '#52525b',
              lineHeight: 1.35,
            }}
          >
            Spatial canvas, real-time sync, enterprise RBAC — ship workflows
            without rebuilding your stack.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 18px',
              borderRadius: 999,
              background: '#09090b',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {BRAND_NAME}
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#71717a' }}>
            Multi-tenant · Canvas · AI
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
