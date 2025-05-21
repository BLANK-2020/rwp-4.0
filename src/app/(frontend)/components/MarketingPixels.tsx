'use client'

import React, { useEffect, useState } from 'react'
import Script from 'next/script'
import { ConsentCategory, hasConsent } from '../../../lib/consentManager'

interface MarketingConfig {
  facebookPixel?: {
    enabled: boolean
    pixelId: string
    advancedMatching: boolean
  }
  googleTagManager?: {
    enabled: boolean
    containerId: string
  }
  linkedInInsightTag?: {
    enabled: boolean
    partnerId: string
  }
  googleAnalytics?: {
    enabled: boolean
    measurementId: string
  }
}

/**
 * Marketing Pixels Component
 *
 * This component conditionally loads marketing pixels based on user consent.
 * It includes Meta Pixel (Facebook), LinkedIn Insight Tag, and Google Tag Manager.
 * It fetches tenant-specific pixel IDs from the API.
 */
export const MarketingPixels: React.FC = () => {
  const hasMarketingConsent = hasConsent(ConsentCategory.MARKETING)
  const hasAnalyticsConsent = hasConsent(ConsentCategory.ANALYTICS)
  const [marketingConfig, setMarketingConfig] = useState<MarketingConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch tenant marketing configuration
  useEffect(() => {
    const fetchMarketingConfig = async () => {
      try {
        // Get the current hostname
        const hostname = window.location.hostname

        // Fetch the tenant configuration based on the hostname
        const response = await fetch(`/api/tenants/marketing-config?hostname=${hostname}`)

        if (response.ok) {
          const data = await response.json()
          setMarketingConfig(data.marketingConfig)
        } else {
          console.error('Failed to fetch marketing configuration')
        }
      } catch (error) {
        console.error('Error fetching marketing configuration:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMarketingConfig()
  }, [])

  // Initialize Facebook Pixel
  useEffect(() => {
    if (
      hasMarketingConsent &&
      marketingConfig?.facebookPixel?.enabled &&
      marketingConfig.facebookPixel.pixelId &&
      typeof window !== 'undefined'
    ) {
      // Initialize Facebook Pixel

      window.fbq =
        window.fbq ||
        function () {
          // eslint-disable-next-line prefer-rest-params
          ;(window.fbq.q = window.fbq.q || []).push(arguments)
        }
      window._fbq = window._fbq || window.fbq
      window.fbq('init', marketingConfig.facebookPixel.pixelId)
      window.fbq('track', 'PageView')
    }
  }, [hasMarketingConsent, marketingConfig])

  // Initialize LinkedIn Insight Tag
  useEffect(() => {
    if (
      hasMarketingConsent &&
      marketingConfig?.linkedInInsightTag?.enabled &&
      marketingConfig.linkedInInsightTag.partnerId &&
      typeof window !== 'undefined'
    ) {
      // Initialize LinkedIn Insight Tag
      window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || []
      window._linkedin_data_partner_ids.push(marketingConfig.linkedInInsightTag.partnerId)
    }
  }, [hasMarketingConsent, marketingConfig])

  // If still loading or no consent, don't render anything
  if (isLoading || (!hasMarketingConsent && !hasAnalyticsConsent)) {
    return null
  }

  return (
    <>
      {/* Google Tag Manager */}
      {hasAnalyticsConsent &&
        marketingConfig?.googleTagManager?.enabled &&
        marketingConfig.googleTagManager.containerId && (
          <>
            <Script
              id="gtm-script"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${marketingConfig.googleTagManager.containerId}');
              `,
              }}
            />
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${marketingConfig.googleTagManager.containerId}`}
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
              />
            </noscript>
          </>
        )}

      {/* Facebook Pixel */}
      {hasMarketingConsent &&
        marketingConfig?.facebookPixel?.enabled &&
        marketingConfig.facebookPixel.pixelId && (
          <>
            <Script
              id="facebook-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${marketingConfig.facebookPixel.pixelId}');
                fbq('track', 'PageView');
              `,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${marketingConfig.facebookPixel.pixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}

      {/* LinkedIn Insight Tag */}
      {hasMarketingConsent &&
        marketingConfig?.linkedInInsightTag?.enabled &&
        marketingConfig.linkedInInsightTag.partnerId && (
          <>
            <Script
              id="linkedin-insight-tag"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                _linkedin_partner_id = "${marketingConfig.linkedInInsightTag.partnerId}";
                window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
                window._linkedin_data_partner_ids.push(_linkedin_partner_id);
                (function(l) {
                  if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
                  window.lintrk.q=[]}
                  var s = document.getElementsByTagName("script")[0];
                  var b = document.createElement("script");
                  b.type = "text/javascript";b.async = true;
                  b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
                  s.parentNode.insertBefore(b, s);})(window.lintrk);
              `,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                alt=""
                src={`https://px.ads.linkedin.com/collect/?pid=${marketingConfig.linkedInInsightTag.partnerId}&fmt=gif`}
              />
            </noscript>
          </>
        )}

      {/* Google Analytics */}
      {hasAnalyticsConsent &&
        marketingConfig?.googleAnalytics?.enabled &&
        marketingConfig.googleAnalytics.measurementId && (
          <>
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${marketingConfig.googleAnalytics.measurementId}`}
            />
            <Script
              id="google-analytics-config"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${marketingConfig.googleAnalytics.measurementId}');
              `,
              }}
            />
          </>
        )}
    </>
  )
}

// Add TypeScript declarations for global window object
declare global {
  interface Window {
    fbq: any
    _fbq: any
    dataLayer: any
    _linkedin_data_partner_ids: any
    lintrk: any
    gtag: any
  }
}
