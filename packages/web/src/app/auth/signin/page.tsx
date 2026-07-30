export default function SignInPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center">
      <div className="w-full max-w-sm rounded border border-zinc-200 p-8 dark:border-zinc-800">
        <h1 className="mb-6 text-xl font-semibold">Sign in to Ops Agenda</h1>
        <a
          href="/api/auth/signin"
          className="inline-block w-full rounded bg-zinc-900 px-4 py-2 text-center text-sm text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Sign in with Cognito
        </a>
      </div>
    </div>
  );
}
