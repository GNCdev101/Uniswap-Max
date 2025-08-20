import { Header } from "@/components/Header";
import { LiquidityProvision } from "@/components/LiquidityProvision";

export default function PoolsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow p-4 md:p-8">
        <LiquidityProvision />
      </main>
    </div>
  );
}
