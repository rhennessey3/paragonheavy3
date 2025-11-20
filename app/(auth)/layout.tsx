import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`min-h-screen bg-background flex items-center justify-center ${inter.className}`}>
      <div className="max-w-md w-full space-y-8 p-8">
        {children}
      </div>
    </div>
  );
}