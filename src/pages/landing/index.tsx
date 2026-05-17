import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Workflow, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/layout/footer';
import { SectionHeading } from '@/components/common/section-heading';
import { featureHighlights, workflowSteps } from '@/constants/features';
import { pricingPlans } from '@/constants/pricing';
import { publicNavigation } from '@/constants/navigation';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 }
};

const stats = [
  { label: 'Clause confidence', value: '98.4%' },
  { label: 'Control coverage', value: '120+' },
  { label: 'Privacy workflows', value: '24/7' }
];

const buttonLinkClass =
  'inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export function LandingPage() {
  return (
    <div className="overflow-hidden">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary shadow-glow">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="font-display text-lg font-semibold">SecureShip</div>
              <div className="text-xs text-muted-foreground">Privacy-first AI compliance</div>
            </div>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            {publicNavigation.map((item) => (
              <a key={item.label} href={item.href} className="text-sm text-slate-300 transition hover:text-white">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className={`${buttonLinkClass} border border-white/10 bg-white/5 text-white hover:bg-white/10`}>
              Log in
            </Link>
            <Link to="/register" className={`${buttonLinkClass} bg-primary text-primary-foreground shadow-glow hover:bg-primary/90`}>
              Start free
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative border-b border-white/10">
          <div className="absolute inset-0 hero-grid opacity-20" />
          <div className="absolute inset-0 bg-hero-radial opacity-80" />
          <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
            <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="space-y-8">
              <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">Secure legal AI for regulated teams</Badge>
              <div className="space-y-6">
                <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
                  Generate compliant legal documents and audit your product in one workspace.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-300">
                  SecureShip helps privacy teams draft policies, validate clause coverage, and produce compliance scorecards using privacy-first AI that stays local in the browser.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link to="/register" className={`${buttonLinkClass} bg-primary text-primary-foreground shadow-glow hover:bg-primary/90`}>
                  Create your workspace
                  <ArrowRight className="size-4" />
                </Link>
                <a href="#features" className={`${buttonLinkClass} border border-white/10 bg-white/5 text-white hover:bg-white/10`}>
                  Explore features
                </a>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <Card key={stat.label} className="bg-white/5">
                    <CardContent className="p-5">
                      <div className="text-3xl font-semibold text-white">{stat.value}</div>
                      <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>

            <motion.div {...fadeUp} transition={{ duration: 0.65, delay: 0.05 }} className="relative">
              <div className="absolute -left-6 -top-6 hidden size-28 rounded-full bg-primary/20 blur-3xl lg:block" />
              <Card className="relative overflow-hidden border-white/10 bg-slate-950/80">
                <CardContent className="space-y-6 p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Live compliance overview</p>
                      <h2 className="text-2xl font-semibold text-white">SecureShip workspace</h2>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Score</p>
                      <p className="text-3xl font-semibold text-emerald-300">94</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <Sparkles className="size-4 text-primary" /> AI legal draft
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300">Generated privacy policy sections with jurisdiction-aware language and clause summaries.</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <Workflow className="size-4 text-secondary" /> Audit pipeline
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300">Mapped findings into remediation queues, scorecards, and exportable reports.</p>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/8 to-white/3 p-5">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>GDPR clause confidence</span>
                      <span>98%</span>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-[98%] rounded-full bg-gradient-to-r from-brand-blue via-accent to-secondary" />
                    </div>
                    <ul className="mt-4 space-y-2 text-sm text-slate-300">
                      <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-300" /> Notices and lawful basis mapped</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-300" /> Retention and deletion path documented</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-300" /> Vendor controls summarized</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Features"
            title="Built for legal drafting, compliance audits, and executive reporting"
            description="SecureShip consolidates the workflows privacy teams usually spread across docs, spreadsheets, and point tools into a single production-grade dashboard."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureHighlights.map((feature, index) => (
              <motion.div key={feature.title} {...fadeUp} transition={{ duration: 0.45, delay: index * 0.05 }}>
                <Card className="h-full bg-white/5">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center justify-between">
                      <Badge className="border-primary/30 bg-primary/10 text-primary">{String(index + 1).padStart(2, '0')}</Badge>
                      <LockKeyhole className="size-4 text-emerald-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm leading-6 text-slate-300">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="workflow" className="border-y border-white/10 bg-white/3 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Workflow"
              title="A simple path from product context to board-ready compliance output"
              description="The workflow keeps scope clear: capture context, generate documents, run audits, and package the results for legal and product stakeholders."
            />
            <div className="mt-10 grid gap-4 lg:grid-cols-4">
              {workflowSteps.map((step, index) => (
                <Card key={step} className="bg-white/5">
                  <CardContent className="flex h-full items-start gap-4 p-5">
                    <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">0{index + 1}</div>
                    <p className="pt-2 text-sm leading-6 text-slate-200">{step}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="space-y-6">
            <SectionHeading
              eyebrow="Privacy-first AI"
              title="Run AI locally in the browser without moving sensitive data into a black box"
              description="The foundation is designed so teams can orchestrate legal drafting and compliance intelligence locally, then connect Firebase-backed auth and storage as they scale."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="bg-white/5">
                <CardContent className="p-5">
                  <p className="text-sm font-semibold text-white">Browser-side orchestration</p>
                  <p className="mt-2 text-sm text-muted-foreground">Generate drafts and scorecards while keeping the UI responsive and privacy-conscious.</p>
                </CardContent>
              </Card>
              <Card className="bg-white/5">
                <CardContent className="p-5">
                  <p className="text-sm font-semibold text-white">Scalable integration points</p>
                  <p className="mt-2 text-sm text-muted-foreground">Firebase, TanStack Query, and Zustand are ready for production backend workflows.</p>
                </CardContent>
              </Card>
            </div>
          </div>
          <Card className="bg-slate-950/75">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Privacy posture</p>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">Local-first</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-semibold text-white">Zero</p>
                  <p className="text-sm text-muted-foreground">External AI calls required for the starter experience</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-semibold text-white">1 click</p>
                  <p className="text-sm text-muted-foreground">Generate, audit, and export from the same UI</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-semibold text-white">100%</p>
                  <p className="text-sm text-muted-foreground">Production-ready frontend foundation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Pricing"
            title="Simple plans that scale with your compliance workload"
            description="Start with the core SaaS workflow foundation and expand into enterprise controls when your team is ready."
          />
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <Card key={plan.name} className="bg-white/5">
                <CardContent className="space-y-5 p-6">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{plan.name}</p>
                    <h3 className="mt-2 text-3xl font-semibold text-white">{plan.price}</h3>
                    <p className="mt-2 text-sm text-slate-300">{plan.description}</p>
                  </div>
                  <ul className="space-y-3 text-sm text-slate-300">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-300" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className={`${buttonLinkClass} w-full bg-primary text-primary-foreground shadow-glow hover:bg-primary/90`}>
                    Choose {plan.name}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t border-white/10 bg-white/3">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-primary/15 via-white/5 to-secondary/10 p-8 shadow-panel sm:p-10">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="space-y-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Ready to ship compliance faster</p>
                  <h2 className="text-4xl font-semibold text-white">Start with SecureShip today.</h2>
                  <p className="max-w-2xl text-lg leading-8 text-slate-300">
                    Use this foundation to launch a privacy-first AI SaaS with clear routes, scalable state, and polished workflows for legal generation, audits, and reporting.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link to="/register" className={`${buttonLinkClass} bg-primary text-primary-foreground shadow-glow hover:bg-primary/90`}>
                    Create account
                  </Link>
                  <Link to="/login" className={`${buttonLinkClass} border border-white/10 bg-white/5 text-white hover:bg-white/10`}>
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}