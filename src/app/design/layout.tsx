import "./design.css";
import { inter, jetbrainsMono, spaceGrotesk } from "./fonts";

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      {children}
    </div>
  );
}
