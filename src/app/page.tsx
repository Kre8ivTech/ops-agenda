export default function Home() {
  return (
    <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20">
      <main className="row-start-2 flex flex-col items-center gap-8 sm:items-start">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold">Ops Agenda</h1>
          <p className="text-lg text-gray-600">
            AI-Powered Daily Operations Brief - Coming Soon
          </p>
          <div className="mt-8 flex flex-col gap-4 rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold">What is Ops Agenda?</h2>
            <p className="text-gray-600">
              Ops Agenda transforms your Microsoft 365 email and calendar data into a clear,
              prioritized operational agenda — automatically, every morning.
            </p>
            <div className="mt-4">
              <h3 className="mb-2 font-semibold">North Star Feature: Daily Ops Brief</h3>
              <ul className="ml-6 list-disc space-y-1 text-sm text-gray-600">
                <li>Narrative summary of the day ahead</li>
                <li>Visual timeline of meetings and focus blocks</li>
                <li>Top 3 priorities (AI-ranked)</li>
                <li>Due-outs with deadlines</li>
                <li>Meeting prep materials</li>
                <li>Suggested focus blocks</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <footer className="row-start-3 flex flex-wrap items-center justify-center gap-6">
        <p className="text-sm text-gray-500">
          © 2026 Kre8ivTech | Built by Jeremiah Castillo
        </p>
      </footer>
    </div>
  );
}
