import Script from 'next/script'

interface Product {
  id: string
  title: string
  description: string
  price: number
  condition: string
  category: string
  brand?: string
  model?: string
  location: string
  images: Array<{ url: string }>
  seller: {
    name: string
    id: string
  }
  createdAt: string
}

interface StructuredDataProps {
  product: Product
}

export function ProductStructuredData({ product }: StructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "description": product.description,
    "image": product.images.map(img => img.url),
    "brand": product.brand ? {
      "@type": "Brand",
      "name": product.brand
    } : undefined,
    "model": product.model,
    "category": product.category,
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Person",
        "name": product.seller.name
      },
      "itemCondition": `https://schema.org/${product.condition}Condition`
    },
    "location": {
      "@type": "Place",
      "name": product.location
    },
    "datePublished": product.createdAt
  }

  return (
    <Script
      id="product-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData)
      }}
    />
  )
}

