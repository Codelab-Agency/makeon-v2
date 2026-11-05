import { withPayload } from '@payloadcms/next/withPayload';

export default withPayload({
  ...(process.env.NEXT_OUTPUT_STANDALONE === 'true' ? { output: 'standalone' } : {}),
  async redirects() {
    // Canonicalize public HTML only. Do not redirect Stripe webhooks or admin/API POSTs.
    const pages = ['/', '/cafea/:path*', '/cafea-pentru-birouri', '/apa', '/prajitoria', '/cafea-la-evenimente',
      '/termeni-si-conditii', '/politica-de-confidentialitate', '/politica-de-cookie-uri'];
    return pages.map(source => ({ source, has: [{ type: 'host', value: 'www.makeon.ro' }],
      destination: `https://makeon.ro${source}`, permanent: true }));
  },
  async headers() {
    return ['/api/:path*', '/admin/:path*'].map(source => ({ source,
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }));
  },
});
