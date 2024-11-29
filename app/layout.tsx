import { SocketProvider } from "./socketContext"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {



  return (
    <html lang="en" >
      <body>
      <SocketProvider>{children}</SocketProvider>
      </body>
    </html>
  )
}
