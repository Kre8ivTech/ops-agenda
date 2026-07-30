export default function AuthErrorPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center">
      <div className="rounded border border-red-200 bg-red-50 p-6 text-red-900">
        <h1 className="text-lg font-semibold">Authentication error</h1>
        <p className="mt-2 text-sm">Something went wrong while signing you in. Please try again.</p>
      </div>
    </div>
  );
}
