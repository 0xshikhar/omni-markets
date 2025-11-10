import Link from "next/link"
import { ArrowRight, Zap, Zap as Lightning, Brain, Lock, Layers, TrendingUp, Users, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthButton } from "@/components/AuthButton"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFEE8] to-[#F6FCE5]">
      {/* Navbar */}
      <nav className="border-b border-gray-400 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#a4ff31] flex items-center justify-center neon-glow">
              <span className="text-black text-2xl font-bold">◈</span>
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">OmniMarkets</div>
              <div className="text-xs font-semibold text-[#a4ff31]">Liquidity Aggregated Prediction Markets</div>
            </div>
          </Link>
          <AuthButton />
        </div>
      </nav>

      <main className="p-6 md:p-10">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto mb-16">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="inline-block">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#a4ff31] text-black font-semibold text-sm">
              <Zap className="h-4 w-4 text-[#a4ff31]" />
              BSC-Native • AI-Powered • Gasless UX
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            <span className="text-gradient-green">Prediction Markets</span>
            <br />
            <span className="text-foreground">Reimagined</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Aggregate liquidity from Polymarket, AMMs, and more. Resolve disputes with AI-assisted oracles. Trade subjective markets privately. All on BSC with gasless UX.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/feed">
              <Button size="lg" className="text-lg px-8 py-6 bg-[#a4ff31] hover:bg-[#b8ff52] text-black font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 neon-glow">
                Explore Markets
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            
            <Link href="/create">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-gray-400 hover:bg-gray-100 font-semibold">
                Create Market
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="max-w-6xl mx-auto mb-16">
        <h2 className="text-4xl font-black text-center mb-12">Core Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="dual-block-card p-8 hover-lift">
            <div className="h-12 w-12 bg-[#a4ff31] flex items-center justify-center mb-4 rounded">
              <Layers className="h-6 w-6 text-black" />
            </div>
            <h3 className="text-lg font-bold mb-2">Liquidity Aggregation</h3>
            <p className="text-sm text-muted-foreground">
              Route bets across Polymarket, BNB AMMs, and other sources for best prices.
            </p>
          </div>

          <div className="dual-block-card p-8 hover-lift">
            <div className="h-12 w-12 bg-[#a4ff31] flex items-center justify-center mb-4 rounded">
              <Brain className="h-6 w-6 text-black" />
            </div>
            <h3 className="text-lg font-bold mb-2">AI Oracle</h3>
            <p className="text-sm text-muted-foreground">
              Faster resolution with AI-assisted anomaly detection and dispute suggestions.
            </p>
          </div>

          <div className="dual-block-card p-8 hover-lift">
            <div className="h-12 w-12 bg-[#a4ff31] flex items-center justify-center mb-4 rounded">
              <Lock className="h-6 w-6 text-black" />
            </div>
            <h3 className="text-lg font-bold mb-2">Subjective Markets</h3>
            <p className="text-sm text-muted-foreground">
              Private markets with verifier circles and commit-reveal for sensitive events.
            </p>
          </div>

          <div className="dual-block-card p-8 hover-lift">
            <div className="h-12 w-12 bg-[#a4ff31] flex items-center justify-center mb-4 rounded">
              <Lightning className="h-6 w-6 text-black" />
            </div>
            <h3 className="text-lg font-bold mb-2">Gasless UX</h3>
            <p className="text-sm text-muted-foreground">
              ERC-4337 smart accounts with social login. No gas fees, no complexity.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto mb-16">
        <h2 className="text-4xl font-black text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-[#a4ff31] text-black font-black text-lg flex items-center justify-center rounded">1</div>
            <h3 className="text-2xl font-bold">Create or Join</h3>
            <p className="text-muted-foreground">
              Create your own prediction market or join existing ones. Set resolution criteria and dispute parameters.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 bg-[#a4ff31] text-black font-black text-lg flex items-center justify-center rounded">2</div>
            <h3 className="text-2xl font-bold">Place Bets</h3>
            <p className="text-muted-foreground">
              Bet on outcomes with liquidity routed across multiple sources. Get best prices automatically.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 bg-[#a4ff31] text-black font-black text-lg flex items-center justify-center rounded">3</div>
            <h3 className="text-2xl font-bold">Resolve & Earn</h3>
            <p className="text-muted-foreground">
              AI oracle resolves markets. Dispute if needed. Earn rewards for honest participation.
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="max-w-6xl mx-auto mb-16">
        <h2 className="text-4xl font-black text-center mb-12">Built For Scale</h2>
        <div className="dual-block-card p-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#a4ff31]" />
                On-Chain
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• MarketAggregator.sol</li>
                <li>• AIOracleDispute.sol</li>
                <li>• SubjectiveMarketFactory.sol</li>
                <li>• BSC + opBNB</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#a4ff31]" />
                Services
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Market Syncer</li>
                <li>• AI Oracle</li>
                <li>• Dispute Bot</li>
                <li>• Subjective Oracle</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#a4ff31]" />
                Frontend
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Next.js 15</li>
                <li>• Wagmi + Viem</li>
                <li>• Privy Auth</li>
                <li>• Prisma ORM</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto">
        <div className="dual-block-card p-12 text-center space-y-6">
          <h2 className="text-4xl font-black">Ready to Predict?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join the next generation of prediction markets. No gas fees. No complexity. Just pure prediction.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/feed">
              <Button size="lg" className="text-lg px-8 py-6 bg-[#a4ff31] hover:bg-[#b8ff52] text-black font-bold neon-glow">
                Start Trading
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/disputes">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-gray-400 font-semibold">
                View Disputes
              </Button>
            </Link>
          </div>
        </div>
      </section>
      </main>
    </div>
  )
}
