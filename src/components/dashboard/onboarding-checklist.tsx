"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  CreditCard,
  ListPlus,
  Target,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";

type OnboardingChecklistProps = {
  hasBankAccount: boolean;
  hasCreditCard: boolean;
  hasGoal: boolean;
  hasTransaction: boolean;
};

type Step = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: LucideIcon;
  actionLabel: string;
  href?: string;
  onClick?: () => void;
};

const STORAGE_KEY = "carteira-inteligente:onboarding-dismissed";

export function OnboardingChecklist({
  hasBankAccount,
  hasCreditCard,
  hasGoal,
  hasTransaction,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDismissed(window.localStorage.getItem(STORAGE_KEY) === "true");
    setReady(true);
  }, []);

  const steps = useMemo<Step[]>(() => [
    {
      id: "bank-account",
      title: "Conta bancária",
      description: "Use apenas dados de identificação. Número da conta é opcional e o app não acessa seu banco.",
      completed: hasBankAccount,
      icon: WalletCards,
      actionLabel: "Cadastrar conta",
      href: "/dashboard/fluxo-de-caixa?onboarding=conta",
    },
    {
      id: "credit-card",
      title: "Cartão",
      description: "Cadastre só apelido, banco e últimos 4 dígitos. Não pedimos cartão completo, CVV ou senha.",
      completed: hasCreditCard,
      icon: CreditCard,
      actionLabel: "Cadastrar cartão",
      href: "/dashboard/cartoes?onboarding=cartao",
    },
    {
      id: "goal",
      title: "Objetivo financeiro",
      description: "Crie uma meta para acompanhar seu progresso com mais clareza.",
      completed: hasGoal,
      icon: Target,
      actionLabel: "Criar objetivo",
      href: "/dashboard/objetivos",
    },
    {
      id: "transaction",
      title: "Primeira movimentação",
      description: "Registre uma entrada ou saída para começar seu histórico financeiro.",
      completed: hasTransaction,
      icon: ListPlus,
      actionLabel: "Registrar movimentação",
      onClick: () => window.dispatchEvent(new Event("open-movement-modal")),
    },
  ], [hasBankAccount, hasCreditCard, hasGoal, hasTransaction]);

  const completedCount = steps.filter((step) => step.completed).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  function dismiss() {
    window.localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  }

  function resume() {
    window.localStorage.removeItem(STORAGE_KEY);
    setDismissed(false);
  }

  if (completedCount === steps.length) return null;

  if (ready && dismissed) {
    return (
      <section className="dashboard-card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-moss-600">Primeiros passos</p>
          <p className="mt-1 text-sm text-slate-500">
            {completedCount} de {steps.length} passos concluídos. Retome quando quiser terminar sua configuração inicial.
          </p>
        </div>
        <button
          onClick={resume}
          className="focus-ring inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          Retomar guia
        </button>
      </section>
    );
  }

  return (
    <section className="dashboard-card mb-6 overflow-hidden">
      <div className="bg-slate-950 p-5 text-white sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-moss-500">Primeiros passos</p>
            <h2 className="mt-2 font-[var(--font-manrope)] text-2xl font-extrabold tracking-[-0.035em]">
              Monte sua primeira visão financeira
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Cadastre uma conta, um cartão, um objetivo e uma primeira movimentação para a Carteira Inteligente começar a organizar sua vida financeira. Você não precisa fazer tudo agora, basta começar pelo mínimo.
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Conta e cartão servem apenas para identificação e organização. Não pedimos senha, CVV, login bancário nem acessamos banco ou cartão automaticamente.
            </p>
          </div>
          <button
            onClick={dismiss}
            className="focus-ring inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
            aria-label="Dispensar guia de primeiros passos"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-300">
            <span>{completedCount} de {steps.length} passos concluídos</span>
            <span>{progress}% configurado</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-moss-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-2">
        {steps.map((step) => (
          <OnboardingStep key={step.id} step={step} />
        ))}
      </div>
    </section>
  );
}

function OnboardingStep({ step }: { step: Step }) {
  const Icon = step.icon;
  const status = step.completed ? (
    <CheckCircle2 className="size-5 text-moss-600" />
  ) : (
    <Circle className="size-5 text-slate-300" />
  );
  const actionClassName = "focus-ring inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400";

  return (
    <article className={`rounded-3xl border p-4 ${step.completed ? "border-moss-100 bg-moss-50/60" : "border-slate-100 bg-slate-50"}`}>
      <div className="flex items-start gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${step.completed ? "bg-white text-moss-700" : "bg-white text-slate-600"}`}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-extrabold text-slate-950">{step.title}</h3>
            {status}
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-500">{step.description}</p>
          <div className="mt-4">
            {step.href ? (
              <Link href={step.href} className={actionClassName}>
                {step.completed ? "Ver" : step.actionLabel}
                <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <button onClick={step.onClick} className={actionClassName}>
                {step.completed ? "Ver fluxo" : step.actionLabel}
                <ArrowRight className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
