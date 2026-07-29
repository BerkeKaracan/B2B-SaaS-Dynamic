import { describe, expect, it } from 'vitest';
import { httpUrlToWsBase, resolveCanvasCollabWsBase } from './collabWsUrl';

describe('httpUrlToWsBase', () => {
  it('keeps wss/ws origins', () => {
    expect(httpUrlToWsBase('wss://api.example.com')).toBe('wss://api.example.com');
    expect(httpUrlToWsBase('ws://localhost:8000/')).toBe('ws://localhost:8000');
  });

  it('maps https/http API URLs to ws bases', () => {
    expect(httpUrlToWsBase('https://api.example.com')).toBe('wss://api.example.com');
    expect(httpUrlToWsBase('http://127.0.0.1:8000')).toBe('ws://127.0.0.1:8000');
  });
});

describe('resolveCanvasCollabWsBase', () => {
  it('prefers NEXT_PUBLIC_WS_URL', () => {
    expect(
      resolveCanvasCollabWsBase({
        explicitWsUrl: 'wss://run.app',
        apiUrl: 'https://other.example',
        protocol: 'https:',
        hostname: 'app.vercel.app',
      })
    ).toBe('wss://run.app');
  });

  it('falls back to API URL on prod host', () => {
    expect(
      resolveCanvasCollabWsBase({
        explicitWsUrl: '',
        apiUrl: 'https://api.example.com',
        protocol: 'https:',
        hostname: 'www.example.com',
      })
    ).toBe('wss://api.example.com');
  });

  it('uses localhost:8000 only on local hosts', () => {
    expect(
      resolveCanvasCollabWsBase({
        protocol: 'http:',
        hostname: 'localhost',
      })
    ).toBe('ws://localhost:8000');
  });

  it('refuses silent :8000 on production frontend host', () => {
    expect(
      resolveCanvasCollabWsBase({
        protocol: 'https:',
        hostname: 'b2b-saas.vercel.app',
      })
    ).toBeNull();
  });
});
