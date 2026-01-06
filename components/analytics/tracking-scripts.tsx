import { prisma } from '@/lib/db'
import Script from 'next/script'

export async function TrackingScripts({ userId }: { userId: string }) {
    if (!userId) return null

    const tracking = await prisma.tracking_pixels.findUnique({
        where: { usuario_id: userId }
    })

    if (!tracking) return null

    return (
        <>
            {/* Facebook Pixel */}
            {tracking.facebook_pixel_id && (
                <Script
                    id="fb-pixel"
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
                        fbq('init', '${tracking.facebook_pixel_id}');
                        fbq('track', 'PageView');
                        `,
                    }}
                />
            )}

            {/* Google Analytics */}
            {tracking.google_analytics_id && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${tracking.google_analytics_id}`}
                        strategy="afterInteractive"
                    />
                    <Script id="google-analytics" strategy="afterInteractive">
                        {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${tracking.google_analytics_id}');
                        `}
                    </Script>
                </>
            )}

            {/* TikTok Pixel */}
            {tracking.tiktok_pixel_id && (
                <Script
                    id="tiktok-pixel"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                        !function (w, d, t) {
                          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t.align=2,ttq.push([t].concat(Array.prototype.slice.call(e,0)))},ttq.instance=function(t){for(var e=ttq.methods,i=0;i<e.length;i++)ttq.setAndDefer(e[i],t);return ttq},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                          ttq.load('${tracking.tiktok_pixel_id}');
                          ttq.page();
                        }(window, document, 'ttq');
                        `,
                    }}
                />
            )}

            {/* Kwai Pixel */}
            {tracking.kwai_pixel_id && (
                <Script
                    id="kwai-pixel"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                        !function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.install=t():e.install=t()}(window,(function(){return function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}return n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)n.d(r,o,function(t){return e[t]}.bind(null,o));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=0)}([function(e,t,n){"use strict";var r=this&&this.__spreadArray||function(e,t,n){if(n||2===arguments.length)for(var r=0,o=t.length,a=e;r<o;r++)!a&&r in t||(a||(a=Array.prototype.slice.call(t,0,r)),a[r]=t[r]);return e.concat(a||Array.prototype.slice.call(t))};!function(e,t,n){var o=window.kwaiq||[];o.load=function(e){o._i=e},o.page=function(){o._t={page:new Date},o.push(["page"])},o.track=function(e,t){o.push(["track",e,t])},o.instance=function(e){var t=o._i[e]||[];return function(e,n){var r=[];return function(){var o=arguments;r.push(function(){e.push([n,Array.prototype.slice.call(o)])})}(),t.push([n,r]),t}(o,e)},o.push=function(e){var t=arguments;o.push.apply(o,t)},window.kwaiq=o;var a=document.createElement("script");a.async=!0,a.src="https://s1.kwai.net/kos/s101/nlav11187/pixel/events.js?sdkid="+e+"&lib="+n;var i=document.getElementsByTagName("script")[0];i.parentNode.insertBefore(a,i)}(0,0,"kwaiq")}]);
                        kwaiq.load('${tracking.kwai_pixel_id}');
                        kwaiq.page();
                        `,
                    }}
                />
            )}
        </>
    )
}
