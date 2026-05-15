import { Helmet } from "react-helmet-async";
import { ReactNode } from "react";

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
  children?: ReactNode;
}

const BASE_URL = "https://www.awardpay.com.au";

const SEO = ({ title, description, path = "/", image, jsonLd, children }: SEOProps) => {
  const url = `${BASE_URL}${path}`;
  const ogImage = image ? (image.startsWith("http") ? image : `${BASE_URL}${image}`) : undefined;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(s)}</script>
      ))}
      {children}
    </Helmet>
  );
};

export default SEO;
