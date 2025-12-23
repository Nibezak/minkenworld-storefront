import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MinkenWorld Marketplace',
    short_name: 'MinkenWorld',
    description: 'MinkenWorld Marketplace - Buy and Sell Homes, Cars, Apparel and More',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/images/minkenworld.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
