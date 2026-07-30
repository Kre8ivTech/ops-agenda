export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-paper flex min-h-full flex-1 flex-col">{children}</div>;
}
