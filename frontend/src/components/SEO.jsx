import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SEO = ({ title, description, keywords, jsonLd }) => {
  const location = useLocation();
  const siteUrl = 'https://meditrack-ultimate.vercel.app';
  const canonicalUrl = `${siteUrl}${location.pathname}`;
  const fullTitle = title ? `${title} | MediTrack` : 'MediTrack - Smart Medicine Manager';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name='description' content={description} />
      <meta name='keywords' content={keywords} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content="index, follow" />
      {jsonLd && (
         <script type="application/ld+json">
           {JSON.stringify(jsonLd)}
         </script>
      )}
    </Helmet>
  );
};

SEO.defaultProps = {
    title: null,
    description: "MediTrack is your ultimate smart medicine manager. Track prescriptions, get reminders, and manage your health efficiently.",
    keywords: "medicine tracker, health management, pill reminder, medical records, family health, health intelligence, meditrack",
    jsonLd: null
};

export default SEO;
