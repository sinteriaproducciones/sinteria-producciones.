import type { Metadata } from "next";
import "./globals.css";
import "./celebration.css";
import "./stage-two.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sinteria-producciones.genrrytm16.chatgpt.site"),
  title: "Sinteria Producciones | Horas locas y shows en Lima",
  description: "Diversión que hace la diferencia. Horas locas, personajes y shows para tus eventos. Cotiza por WhatsApp. RUC 10742038551. Perteneciente a Sinteria Group.",
  openGraph: { title: "Sinteria Producciones", description: "Que tu fiesta se vuelva inolvidable. Cotiza tu hora loca por WhatsApp.", locale: "es_PE", type: "website", images: ["/assets/fiesta-hero.png"] },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
