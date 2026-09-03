import "./globals.css";

export const metadata = {
  title: "Vistoria de Área — Cerradão",
  description: "App de vistoria de área (infestação, pragas, vigor da soqueira, falha)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
