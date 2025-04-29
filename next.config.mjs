/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: true,
  },
  // Configuración para entorno de producción
  productionBrowserSourceMaps: false, // Deshabilitar source maps en producción para mejor rendimiento
  poweredByHeader: false, // Eliminar el header X-Powered-By por seguridad
  compress: true, // Habilitar compresión gzip
  // Configuración de headers de seguridad adicionales
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
  // Configuración de webpack para manejar módulos de Node.js
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // No intentar resolver módulos de Node.js en el cliente
      config.resolve.fallback = {
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        process: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
