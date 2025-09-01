import { Providers } from "./providers";
import "./globals.css";
import MouseTrail from "./components/MouseTrail";
import MouseWave from "./components/MouseWave";
import MouseStars from "./components/MouseStars";
import MouseLightRings from "./components/MouseLightRings";
import BackgroundParticles from "./components/BackgroundParticles";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <BackgroundParticles />
          <MouseLightRings />
          <MouseWave />
          <MouseStars />
          <MouseTrail />
          {children}
        </Providers>
      </body>
    </html>
  );
}
