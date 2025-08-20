import { Header } from "@/components/Header";
import { TradingTerminal } from "@/components/TradingTerminal";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow p-4 md:p-8">
        <TradingTerminal />
      </main>
    </div>
  );
}
