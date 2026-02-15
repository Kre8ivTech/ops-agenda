"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");

  const handleSignIn = () => {
    signIn("microsoft-entra-id", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-10 shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Ops Agenda
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Transform your Microsoft 365 email and calendar into a prioritized daily agenda
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Authentication error</h3>
                <div className="mt-2 text-sm text-red-700">
                  {error === "OAuthAccountNotLinked"
                    ? "This email is already associated with another account."
                    : "An error occurred during sign in. Please try again."}
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <button
            onClick={handleSignIn}
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                className="h-5 w-5 text-blue-300 group-hover:text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            Sign in with Microsoft 365
          </button>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">What you'll get</span>
            </div>
          </div>

          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <svg
                className="mr-2 mt-0.5 h-4 w-4 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Daily Ops Brief with AI-ranked priorities
            </li>
            <li className="flex items-start">
              <svg
                className="mr-2 mt-0.5 h-4 w-4 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Automated deadline detection
            </li>
            <li className="flex items-start">
              <svg
                className="mr-2 mt-0.5 h-4 w-4 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Meeting prep and focus block suggestions
            </li>
            <li className="flex items-start">
              <svg
                className="mr-2 mt-0.5 h-4 w-4 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Read-only access (Mail.Read, Calendars.Read)
            </li>
          </ul>
        </div>

        <div className="text-center text-xs text-gray-500">
          <p>Your data is encrypted and secure.</p>
          <p className="mt-1">We never store raw email bodies.</p>
        </div>
      </div>
    </div>
  );
}
