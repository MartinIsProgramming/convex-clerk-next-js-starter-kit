import { SignIn } from "@clerk/nextjs";

const clerkAppearance = {
  elements: {
    formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
    footerActionLink: "text-blue-600 hover:text-blue-700",
  },
} as const;

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn appearance={clerkAppearance} routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </div>
  );
}
