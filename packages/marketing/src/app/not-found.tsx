import { ButtonLink } from '@/components/button';
import { Lockup } from '@/components/lockup';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Lockup />
      <div>
        <h1 className="text-ink m-0 mb-2 text-[1.6rem] font-extrabold">Page not found.</h1>
        <p className="text-text-secondary m-0 text-[0.95rem]">
          The page you are looking for does not exist.
        </p>
      </div>
      <ButtonLink href="/">Back to opsagenda.com</ButtonLink>
    </main>
  );
}
