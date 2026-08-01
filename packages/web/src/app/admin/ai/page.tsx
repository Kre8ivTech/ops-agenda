import Link from 'next/link';

const CARDS = [
  {
    href: '/admin/ai/prompts',
    title: 'Prompts',
    description: 'Create and manage system prompts, templates, and prompt chains.',
  },
  {
    href: '/admin/ai/models',
    title: 'Models',
    description: 'Configure AI model providers, parameters, and fallback strategies.',
  },
  {
    href: '/admin/ai/agents',
    title: 'Agents',
    description: 'Define agent personas, capabilities, and orchestration rules.',
  },
  {
    href: '/admin/ai/usage',
    title: 'Usage',
    description: 'Monitor token consumption, costs, and rate limits across models.',
  },
];

export default function AIOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">
          AI Platform Configuration
        </h2>
        <p className="text-muted-foreground text-sm">
          Manage prompts, models, agents, and monitor token usage.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-lg border border-border p-5 transition-colors hover:border-foreground/20 hover:bg-muted/50"
          >
            <h3 className="font-semibold group-hover:text-foreground">
              {card.title}
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
