import { ButtonLink } from '@/components/button';
import { SIGNUP_URL } from '@/lib/app-links';

export function PricingCard({
  name,
  price,
  entities,
  modules,
  featured = false,
}: {
  name: string;
  price: string;
  entities: string;
  modules: string;
  featured?: boolean;
}) {
  return (
    <article
      className={`grid gap-4 rounded-[8px] border p-6 ${
        featured ? 'border-ink bg-ink text-white' : 'border-border bg-white'
      }`}
    >
      <div>
        <p
          className={`m-0 mb-1 font-mono text-[0.72rem] font-extrabold uppercase tracking-[0.02em] ${
            featured ? 'text-signal-on-ink' : 'text-signal'
          }`}
        >
          {name}
        </p>
        <p className="m-0 flex items-baseline gap-1">
          <span className="text-[2rem] font-extrabold tracking-[-0.02em]">{price}</span>
          <span className={featured ? 'text-white/70' : 'text-text-secondary'}>/month</span>
        </p>
      </div>
      <ul
        className={`m-0 grid gap-2 p-0 text-[0.88rem] ${featured ? 'text-white/85' : 'text-ink'}`}
      >
        <li className="list-none">{entities}</li>
        <li className="list-none">{modules}</li>
      </ul>
      <ButtonLink
        href={SIGNUP_URL}
        variant={featured ? 'secondary' : 'primary'}
        size="medium"
        className={featured ? '!text-ink hover:!bg-wash !bg-white' : ''}
      >
        Start with {name}
      </ButtonLink>
    </article>
  );
}
