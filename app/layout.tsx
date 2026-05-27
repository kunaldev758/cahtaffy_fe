import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import '@/app/fonts.css'
import '@/app/globals.css'
import { Plus_Jakarta_Sans } from 'next/font/google'


const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var params = new URLSearchParams(window.location.search);
                  var is_S = !!(params.get('shop') || params.get('host') || params.get('hmac'));
                  
                  if (is_S) {
                    var meta = document.createElement('meta');
                    meta.name = 'shopify-api-key';
                    meta.content = ${JSON.stringify(process.env.NEXT_PUBLIC_SHOPIFY_API_KEY ?? "")};
                    document.head.prepend(meta);

                    var script = document.createElement('script');
                    script.src = 'https://cdn.shopify.com/shopifycloud/app-bridge.js';
                    script.async = false;
                    document.head.appendChild(script);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </head>

      <body className={jakarta.className}>
        {children}
        <ToastContainer position="top-right" autoClose={3000} />
      </body>
    </html>
  );
}
