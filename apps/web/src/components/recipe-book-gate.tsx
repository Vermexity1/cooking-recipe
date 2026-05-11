"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChefHat,
  Clock3,
  KeyRound,
  Languages,
  LogIn,
  LockKeyhole,
  Mail,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { CloudBrowserPlatform } from "@/components/cloud-browser-platform";
import { recipes, type Recipe } from "@/lib/recipes";

type FontChoice = "serif" | "sans" | "large";
type LanguageChoice = "English" | "Spanish" | "French" | "Code";
type AccessStep = "settings" | "code" | "account" | "signin" | "verified";

type VerifiedAccount = {
  id: string;
  username: string;
  email: string;
  inviteHash: string;
};

const storageKey = "veil-private-beta-account";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function RecipeBookGate() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontChoice, setFontChoice] = useState<FontChoice>("serif");
  const [language, setLanguage] = useState<LanguageChoice>("English");
  const [accessStep, setAccessStep] = useState<AccessStep>("settings");
  const [code, setCode] = useState("");
  const [query, setQuery] = useState("");
  const [account, setAccount] = useState<VerifiedAccount | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const filteredRecipes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return recipes;
    }

    return recipes.filter((recipe) =>
      [
        recipe.title,
        recipe.category,
        recipe.description,
        ...recipe.ingredients,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query]);

  const openSettings = () => {
    const stored = window.localStorage.getItem(storageKey);

    if (stored) {
      try {
        setAccount(JSON.parse(stored) as VerifiedAccount);
        return;
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }

    setSettingsOpen(true);
  };

  if (account) {
    return <CloudBrowserPlatform account={account} />;
  }

  const unlockCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (code === "0000") {
      setAccessStep("account");
    }
  };

  return (
    <main
      className={cn(
        "h-screen overflow-y-auto bg-[#fbf6ed] text-[#2d2119]",
        fontChoice === "serif" && "font-serif",
        fontChoice === "sans" && "font-sans",
        fontChoice === "large" && "font-serif text-[18px]",
      )}
    >
      <section className="relative border-b border-[#e4d4bd] bg-[#fffaf1]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(206,157,91,0.18),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(107,142,92,0.14),transparent_24%)]" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-5 py-6 sm:px-8 lg:gap-10 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-11 place-items-center rounded-full border border-[#ddc6a7] bg-white text-[#7b4f28] shadow-sm">
                <ChefHat className="size-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-[#8f735b]">
                  Hearth & Laurel
                </p>
                <p className="text-sm text-[#786555]">
                  Seasonal recipes for quiet kitchens
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                aria-label="Open recipe settings"
                className="grid size-9 place-items-center rounded-full border border-[#dcc7a9] bg-white/80 text-[#6d5748] shadow-sm transition hover:bg-white hover:text-[#2d2119]"
                onClick={openSettings}
                type="button"
              >
                <Settings className="size-4" />
              </button>
            </div>
          </header>

          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.65fr)]">
            <div className="max-w-3xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e0cdb2] bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.24em] text-[#8a6240]">
                <Sparkles className="size-3.5" />
                Spring collection
              </p>
              <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.02em] text-[#2d2119] sm:text-6xl lg:text-7xl">
                A recipe book with a soft spot for golden edges.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#6d5748]">
                Browse polished weeknight dinners, quiet brunches, pantry staples,
                and desserts that feel a little ceremonial without becoming fussy.
              </p>
            </div>

            <div className="rounded-[2rem] border border-[#e0cdb2] bg-white p-3 shadow-[0_22px_80px_rgba(83,58,34,0.16)]">
              <div
                aria-label="A plated citrus salad with herbs"
                className="min-h-[390px] rounded-[1.45rem] bg-cover bg-center"
                style={{
                  backgroundImage:
                    "linear-gradient(180deg,rgba(255,250,241,0.02),rgba(45,33,25,0.28)),url(https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1100&q=82)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <div className="mb-6 shrink-0 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#8f735b]">
              Recipe index
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-[#2d2119]">
              24 kitchen-tested favorites
            </h2>
          </div>
          <label className="flex min-h-12 w-full items-center gap-3 rounded-full border border-[#dfc8aa] bg-white px-4 shadow-sm md:max-w-sm">
            <Search className="size-4 shrink-0 text-[#8f735b]" />
            <span className="sr-only">Search recipes</span>
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#a99480]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by dish, mood, or ingredient"
              style={{ caretColor: "transparent" }}
              suppressHydrationWarning
              value={query}
            />
          </label>
        </div>

        <div className="pb-12">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <button
              className="overflow-hidden rounded-[1.5rem] border border-[#e5d5bd] bg-white text-left shadow-[0_18px_50px_rgba(83,58,34,0.08)] transition hover:-translate-y-1 hover:border-[#c99f6c] hover:shadow-[0_24px_60px_rgba(83,58,34,0.14)]"
              key={recipe.title}
              onClick={() => setSelectedRecipe(recipe)}
              type="button"
            >
              <div
                aria-label={`${recipe.title} recipe photo`}
                className="h-56 bg-cover bg-center"
                style={{ backgroundImage: `url(${recipe.image})` }}
              />
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-[#8f735b]">
                  <span>{recipe.category}</span>
                  <span className="flex items-center gap-1 normal-case tracking-normal">
                    <Clock3 className="size-3.5" />
                    {recipe.time}
                  </span>
                </div>
                <h3 className="text-2xl font-semibold text-[#2d2119]">
                  {recipe.title}
                </h3>
                <p className="mt-3 min-h-16 text-sm leading-6 text-[#6d5748]">
                  {recipe.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {recipe.ingredients.map((ingredient) => (
                    <span
                      className="rounded-full bg-[#f5ead9] px-3 py-1 text-xs text-[#6d5748]"
                      key={ingredient}
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
          </div>
        </div>
      </section>

      {selectedRecipe && (
        <RecipeDetailModal
          onClose={() => setSelectedRecipe(null)}
          recipe={selectedRecipe}
        />
      )}

      {settingsOpen && (
        <SettingsPanel
          accessStep={accessStep}
          code={code}
          fontChoice={fontChoice}
          language={language}
          onClose={() => setSettingsOpen(false)}
          onCodeChange={setCode}
          onFontChange={setFontChoice}
          onLanguageChange={(nextLanguage) => {
            setLanguage(nextLanguage);
            setAccessStep(nextLanguage === "Code" ? "code" : "settings");
          }}
          onUnlockCode={unlockCode}
          onVerified={(nextAccount) => {
            window.localStorage.setItem(storageKey, JSON.stringify(nextAccount));
            setAccount(nextAccount);
          }}
        />
      )}
    </main>
  );
}

function SettingsPanel({
  accessStep,
  code,
  fontChoice,
  language,
  onClose,
  onCodeChange,
  onFontChange,
  onLanguageChange,
  onUnlockCode,
  onVerified,
}: {
  accessStep: AccessStep;
  code: string;
  fontChoice: FontChoice;
  language: LanguageChoice;
  onClose: () => void;
  onCodeChange: (code: string) => void;
  onFontChange: (font: FontChoice) => void;
  onLanguageChange: (language: LanguageChoice) => void;
  onUnlockCode: (event: FormEvent<HTMLFormElement>) => void;
  onVerified: (account: VerifiedAccount) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-[#2d2119]/30 p-4 backdrop-blur-sm">
      <div className="ml-auto flex h-full max-w-xl flex-col overflow-hidden rounded-[1.75rem] border border-[#e0cdb2] bg-[#fffaf1] shadow-[0_22px_90px_rgba(45,33,25,0.22)]">
        <div className="flex items-center justify-between border-b border-[#e5d5bd] px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#8f735b]">
              Settings
            </p>
            <h2 className="text-2xl font-semibold text-[#2d2119]">
              Reading preferences
            </h2>
          </div>
          <button
            aria-label="Close settings"
            className="grid size-9 place-items-center rounded-full bg-white text-[#6d5748] transition hover:text-[#2d2119]"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <SettingBlock icon={SlidersHorizontal} title="Typography">
            <div className="grid gap-2 sm:grid-cols-3">
              {(["serif", "sans", "large"] as FontChoice[]).map((font) => (
                <button
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-left text-sm capitalize transition",
                    fontChoice === font
                      ? "border-[#8b5e34] bg-[#f4e4cb] text-[#2d2119]"
                      : "border-[#e0cdb2] bg-white text-[#6d5748] hover:border-[#cfa97d]",
                  )}
                  key={font}
                  onClick={() => onFontChange(font)}
                  type="button"
                >
                  {font === "large" ? "Large serif" : font}
                </button>
              ))}
            </div>
          </SettingBlock>

          <SettingBlock icon={Languages} title="Language">
            <select
              className="h-12 w-full rounded-2xl border border-[#e0cdb2] bg-white px-4 text-[#2d2119] outline-none"
              onChange={(event) =>
                onLanguageChange(event.target.value as LanguageChoice)
              }
              value={language}
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>Code</option>
            </select>
          </SettingBlock>

          {accessStep === "code" && (
            <SettingBlock icon={LockKeyhole} title="Private beta access">
              <form className="space-y-3" onSubmit={onUnlockCode}>
                <p className="text-sm leading-6 text-[#6d5748]">
                  The Code language option is for the private beta workspace.
                  Enter the access code to continue.
                </p>
                <input
                  className="h-12 w-full rounded-2xl border border-[#e0cdb2] bg-white px-4 font-mono text-[#2d2119] outline-none"
                  inputMode="numeric"
                  maxLength={4}
                  onChange={(event) => onCodeChange(event.target.value)}
                  placeholder="0000"
                  value={code}
                />
                <button
                  className="h-12 w-full rounded-2xl bg-[#2d2119] px-4 text-sm font-semibold text-white transition hover:bg-[#4a382c]"
                  type="submit"
                >
                  Continue
                </button>
                {code && code !== "0000" && (
                  <p className="text-sm text-[#9f513c]">
                    That code does not match.
                  </p>
                )}
              </form>
            </SettingBlock>
          )}

          {accessStep === "account" && (
            <div className="grid gap-4">
              <PrivateBetaAccountForm onVerified={onVerified} />
              <SignInForm onVerified={onVerified} />
            </div>
          )}

          {accessStep === "signin" && <SignInForm onVerified={onVerified} />}

          {accessStep === "verified" && (
            <div className="rounded-3xl border border-[#b7d2a8] bg-[#edf7e8] p-4 text-[#35592d]">
              <CheckCircle2 className="mb-3 size-6" />
              Your account is verified.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingBlock({
  children,
  icon: Icon,
  title,
}: {
  children: ReactNode;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <section className="rounded-[1.35rem] border border-[#e4d4bd] bg-white/70 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-full bg-[#f2e4d0] text-[#7b4f28]">
          <Icon className="size-4" />
        </span>
        <h3 className="text-lg font-semibold text-[#2d2119]">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function PrivateBetaAccountForm({
  onVerified,
}: {
  onVerified: (account: VerifiedAccount) => void;
}) {
  const [accountEmail, setAccountEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteKey, setInviteKey] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setError("");

    if (password !== confirmPassword) {
      setStatus("error");
      setError("Passwords do not match.");
      return;
    }

    const response = await fetch("/api/invites/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountEmail, inviteKey, password, username }),
    });
    const payload = (await response.json()) as {
      account?: VerifiedAccount;
      error?: string;
    };

    if (!response.ok || !payload.account) {
      setStatus("error");
      setError(payload.error ?? "Unable to verify that key.");
      return;
    }

    onVerified(payload.account);
  };

  return (
    <SettingBlock icon={KeyRound} title="Create private beta account">
      <form className="space-y-3" onSubmit={submit}>
        <p className="text-sm leading-6 text-[#6d5748]">
          Use one of your private verification keys. Each key links to one
          account and cannot be claimed by another email after that. Passwords
          are hashed on the server before storage.
        </p>
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-[0.16em] text-[#8f735b]">
            Username
          </span>
          <div className="flex h-12 items-center gap-2 rounded-2xl border border-[#e0cdb2] bg-white px-4">
            <UserRound className="size-4 text-[#8f735b]" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="yourname"
              value={username}
            />
          </div>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-[0.16em] text-[#8f735b]">
            Email
          </span>
          <div className="flex h-12 items-center gap-2 rounded-2xl border border-[#e0cdb2] bg-white px-4">
            <UserRound className="size-4 text-[#8f735b]" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              onChange={(event) => setAccountEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              value={accountEmail}
            />
          </div>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-[0.16em] text-[#8f735b]">
            Verification key
          </span>
          <input
            className="h-12 w-full rounded-2xl border border-[#e0cdb2] bg-white px-4 font-mono text-sm uppercase outline-none"
            onChange={(event) => setInviteKey(event.target.value)}
            placeholder="VEIL-XXXX-XXXX-XXXX-XXXX"
            value={inviteKey}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-[0.16em] text-[#8f735b]">
            Password
          </span>
          <input
            className="h-12 w-full rounded-2xl border border-[#e0cdb2] bg-white px-4 text-sm outline-none"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            type="password"
            value={password}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-[0.16em] text-[#8f735b]">
            Confirm password
          </span>
          <input
            className="h-12 w-full rounded-2xl border border-[#e0cdb2] bg-white px-4 text-sm outline-none"
            minLength={8}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat password"
            type="password"
            value={confirmPassword}
          />
        </label>
        <button
          className="h-12 w-full rounded-2xl bg-[#2d2119] px-4 text-sm font-semibold text-white transition hover:bg-[#4a382c] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={status === "loading"}
          type="submit"
        >
          {status === "loading" ? "Checking key..." : "Link key and enter"}
        </button>
        {status === "error" && (
          <p className="rounded-2xl bg-[#fff0e9] px-4 py-3 text-sm text-[#9f513c]">
            {error}
          </p>
        )}
      </form>
    </SettingBlock>
  );
}

function SignInForm({
  onVerified,
}: {
  onVerified: (account: VerifiedAccount) => void;
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setError("");

    const response = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const payload = (await response.json()) as {
      account?: VerifiedAccount;
      error?: string;
    };

    if (!response.ok || !payload.account) {
      setStatus("error");
      setError(payload.error ?? "Unable to sign in.");
      return;
    }

    onVerified(payload.account);
  };

  return (
    <SettingBlock icon={LogIn} title="Sign in to linked account">
      <form className="space-y-3" onSubmit={submit}>
        <p className="text-sm leading-6 text-[#6d5748]">
          Already linked a verification key? Sign in with your username or email
          and password.
        </p>
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-[0.16em] text-[#8f735b]">
            Username or email
          </span>
          <div className="flex h-12 items-center gap-2 rounded-2xl border border-[#e0cdb2] bg-white px-4">
            <Mail className="size-4 text-[#8f735b]" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="username or you@example.com"
              value={identifier}
            />
          </div>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-[0.16em] text-[#8f735b]">
            Password
          </span>
          <input
            className="h-12 w-full rounded-2xl border border-[#e0cdb2] bg-white px-4 text-sm outline-none"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your password"
            type="password"
            value={password}
          />
        </label>
        <button
          className="h-12 w-full rounded-2xl bg-[#2d2119] px-4 text-sm font-semibold text-white transition hover:bg-[#4a382c] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={status === "loading"}
          type="submit"
        >
          {status === "loading" ? "Signing in..." : "Sign in"}
        </button>
        {status === "error" && (
          <p className="rounded-2xl bg-[#fff0e9] px-4 py-3 text-sm text-[#9f513c]">
            {error}
          </p>
        )}
      </form>
    </SettingBlock>
  );
}

function RecipeDetailModal({
  onClose,
  recipe,
}: {
  onClose: () => void;
  recipe: Recipe;
}) {
  const steps = [
    `Gather ${recipe.ingredients.slice(0, 2).join(" and ").toLowerCase()} and prep everything before heating the pan.`,
    "Season generously, cook in steady stages, and keep the texture bright rather than heavy.",
    "Finish with a fresh accent, taste once more, then serve while the edges are at their best.",
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#2d2119]/40 p-4 backdrop-blur-sm">
      <article className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[2rem] border border-[#e0cdb2] bg-[#fffaf1] shadow-[0_28px_100px_rgba(45,33,25,0.28)]">
        <div
          className="relative min-h-72 bg-cover bg-center"
          style={{ backgroundImage: `url(${recipe.image})` }}
        >
          <button
            aria-label="Close recipe"
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/90 text-[#2d2119] shadow-sm"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="max-h-[calc(92vh-18rem)] overflow-y-auto p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#8f735b]">
            <span>{recipe.category}</span>
            <span>/</span>
            <span>{recipe.time}</span>
            <span>/</span>
            <span>serves {recipe.serves}</span>
          </div>
          <h2 className="text-4xl font-semibold text-[#2d2119]">
            {recipe.title}
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#6d5748]">
            {recipe.description}
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl border border-[#e5d5bd] bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="size-5 text-[#8a6240]" />
                <h3 className="text-xl font-semibold">Ingredients</h3>
              </div>
              <ul className="space-y-3 text-sm text-[#5f4a3c]">
                {recipe.ingredients.map((ingredient) => (
                  <li className="flex items-center gap-3" key={ingredient}>
                    <span className="size-2 rounded-full bg-[#c99f6c]" />
                    {ingredient}
                  </li>
                ))}
                <li className="flex items-center gap-3">
                  <span className="size-2 rounded-full bg-[#c99f6c]" />
                  Olive oil, salt, and pepper
                </li>
              </ul>
            </section>
            <section className="rounded-3xl border border-[#e5d5bd] bg-white p-5">
              <h3 className="mb-4 text-xl font-semibold">Method</h3>
              <ol className="space-y-4 text-sm leading-6 text-[#5f4a3c]">
                {steps.map((step, index) => (
                  <li className="flex gap-3" key={step}>
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#f2e4d0] font-mono text-xs text-[#7b4f28]">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </article>
    </div>
  );
}
