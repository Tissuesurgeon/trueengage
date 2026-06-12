import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Coins,
  FileCheck,
  Shield,
  Wallet,
  Workflow,
  Zap,
} from 'lucide-react';
import { TASK_CATEGORIES } from '@trueengage/shared';
import { HomeHero } from '@/components/home/HomeHero';
import { PopularTasks } from '@/components/home/PopularTasks';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CategoryTile } from '@/components/ui/category-tile';
import { Progress } from '@/components/ui/progress';

const TRUSTED_BY = ['MetaMask', 'Venice AI', '1Shot API', 'Circle USDC', 'Ethereum Sepolia'];

const valueProps = [
  {
    title: 'Pay only for verified work',
    desc: 'Funds stay locked in escrow until Venice AI approves the submission.',
  },
  {
    title: 'Autonomous agent payouts',
    desc: 'Payment agents release USDC through permission-limited Smart Accounts — no manual approvals.',
  },
  {
    title: 'Gasless participant rewards',
    desc: 'Earners receive USDC via 1Shot API without holding ETH for gas.',
  },
  {
    title: 'Transparent AI decisions',
    desc: 'Every verification score and reason is recorded and linked to its submission.',
  },
];

const workflowSteps = [
  {
    title: 'Create campaign',
    desc: 'Define tasks, rules, rewards, and budget with a MetaMask Smart Account',
  },
  {
    title: 'Complete tasks',
    desc: 'Participants browse campaigns, accept tasks, and submit proof',
  },
  {
    title: 'AI verifies proof',
    desc: 'Venice AI scores authenticity, quality, and campaign compliance',
  },
  {
    title: 'Agent pays out',
    desc: 'Payment agent releases USDC rewards through permission-based execution',
  },
];

const securityFeatures = [
  {
    icon: <Shield className="h-5 w-5" />,
    title: 'Permission Limits',
    description:
      'Agents cannot spend unlimited funds, access unrelated assets, or execute outside campaign scope.',
  },
  {
    icon: <Coins className="h-5 w-5" />,
    title: 'Escrow System',
    description: 'Funds remain locked in escrow until AI verification approves the submission.',
  },
  {
    icon: <FileCheck className="h-5 w-5" />,
    title: 'Transparent Verification',
    description: 'AI decisions are recorded and linked to every submission for full auditability.',
  },
];

const integrations = [
  {
    icon: <Wallet className="h-5 w-5" />,
    title: 'MetaMask Smart Accounts',
    description:
      'Programmable creator wallets with delegated AI execution and permission-controlled payments.',
  },
  {
    icon: <Bot className="h-5 w-5" />,
    title: 'Venice AI',
    description:
      'Autonomous verification intelligence — content evaluation, spam detection, and compliance scoring.',
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: '1Shot API',
    description:
      'Gasless reward execution so participants receive USDC without worrying about gas fees.',
  },
  {
    icon: <Workflow className="h-5 w-5" />,
    title: 'Agentic Workflow',
    description:
      'Campaign, Verification, and Payment agents coordinate the full lifecycle autonomously.',
  },
];

export default function LandingPage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-16 md:py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,108,246,0.18),transparent_55%)]" />
        <PageContainer className="relative text-center">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.25rem]">
            Find the right{' '}
            <span className="text-[var(--color-brand-to)]">engagement task</span>, right away
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
            Verified campaigns. AI-checked proof. Autonomous USDC rewards on Ethereum Sepolia.
          </p>
          <div className="mt-8 md:mt-10">
            <HomeHero />
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Trusted by
            </span>
            {TRUSTED_BY.map((name) => (
              <span key={name} className="text-sm font-medium text-slate-400">
                {name}
              </span>
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="py-12 md:py-16">
        <PageContainer>
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Browse by category</h2>
            <Link
              href="/marketplace"
              className="text-sm font-medium text-[var(--color-brand)] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {TASK_CATEGORIES.map((c) => (
              <CategoryTile key={c} category={c} />
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="border-y border-[var(--color-border)] bg-[var(--color-bg-surface)] py-12 md:py-16">
        <PageContainer>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Popular tasks</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Trending campaigns with USDC rewards
              </p>
            </div>
            <Link
              href="/marketplace"
              className="text-sm font-medium text-[var(--color-brand)] hover:underline"
            >
              See all
            </Link>
          </div>
          <PopularTasks />
        </PageContainer>
      </section>

      <section className="py-16 md:py-20">
        <PageContainer>
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <h2 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                A whole world of <span className="text-[var(--color-brand)]">verified</span>{' '}
                engagement at your fingertips
              </h2>
              <ul className="mt-8 space-y-5">
                {valueProps.map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-brand)]" />
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <blockquote className="mt-8 border-l-2 border-[var(--color-brand)] pl-4 text-sm italic text-[var(--color-text-muted)]">
                &ldquo;I want 100 real users to create meaningful engagement around my product, and
                I only pay when the work is verified.&rdquo;
              </blockquote>
            </div>

            <Card variant="gradient" className="space-y-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Bot className="h-5 w-5 text-[var(--color-brand)]" />
                Venice AI verification
              </div>
              <Progress value={95} label="Campaign requirement match" showValue size="sm" />
              <Progress value={89} label="Content quality" showValue size="sm" />
              <Progress value={92} label="Authenticity score" showValue size="sm" />
              <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Spam risk: Low</p>
                  <p className="mt-0.5 font-semibold text-[var(--color-success)]">
                    Decision: Approved
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--color-text-muted)]">Reward released</p>
                  <p className="mt-0.5 text-lg font-bold">2 USDC</p>
                </div>
              </div>
            </Card>
          </div>
        </PageContainer>
      </section>

      <section
        id="how-it-works"
        className="border-y border-[var(--color-border)] bg-[var(--color-bg-surface)] py-12 md:py-16"
      >
        <PageContainer>
          <h2 className="text-center text-xl font-bold tracking-tight sm:text-2xl">
            How TrueEngage works
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-[var(--color-text-secondary)]">
            Creator creates campaign → Users complete tasks → AI verifies proof → Agent executes
            payment
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {workflowSteps.map((step, i) => (
              <Card key={step.title} className="text-center">
                <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand)] text-sm font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{step.desc}</p>
              </Card>
            ))}
          </div>
        </PageContainer>
      </section>

      <section id="security" className="py-12 md:py-16">
        <PageContainer>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Security model</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)]">
            TrueEngage minimizes risk through permission limits, escrow, and transparent
            verification.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3 md:gap-5">
            {securityFeatures.map((item) => (
              <Card key={item.title} variant="gradient">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>
        </PageContainer>
      </section>

      <section
        id="powered-by"
        className="border-y border-[var(--color-border)] bg-[var(--color-bg-surface)] py-12 md:py-16"
      >
        <PageContainer>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Powered by</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Built for the MetaMask Smart Accounts Kit × Venice AI × 1Shot API Hackathon.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {integrations.map((item) => (
              <Card key={item.title}>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                  {item.icon}
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="bg-[var(--color-brand)]/5 py-16 md:py-20">
        <PageContainer width="narrow" className="text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Engagement at the speed of{' '}
            <span className="text-[var(--color-brand)]">autonomous agents</span>
          </h2>
          <p className="mt-3 text-[var(--color-text-secondary)]">
            Browse verified tasks and earn USDC on Sepolia testnet.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/marketplace">
              <Button size="lg">
                Browse Tasks
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/create">
              <Button size="lg" variant="outline">
                Create a Campaign
              </Button>
            </Link>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
