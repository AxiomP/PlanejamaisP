/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config, { isServer }) => {
    // Evita warnings do Watchpack ao tentar acessar arquivos do sistema Windows
    if (!isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/D:/**',
          '**/C:/**',
          '**/*.sys',
          '**/System Volume Information/**',
          '**/Config.Msi/**',
          '**/found.*/**',
        ],
      }
    }
    return config
  },
}

module.exports = nextConfig
