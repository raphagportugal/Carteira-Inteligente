"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Eye,
  Landmark,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  createFinancing,
  deleteFinancing,
  markOverdueFinancingPaymentsPaid,
  setFinancingPaymentPaid,
  updateFinancing,
} from "@/app/dashboard/actions";
import { FinancingTypeIcon } from "@/components/dashboard/category-icon";
import { EmptyState } from "@/components/dashboard/empty-state";
import { CurrencyValue } from "@/components/ui/currency-value";
import {
  FINANCING_RATE_INDEXES,
  FINANCING_RATE_TYPES,
  FINANCING_TYPES,
} from "@/lib/finance/catalogs";
import {
  estimateCet,
  getFinancingProgress,
} from "@/lib/finance/financing";
import {
  dateFormatter,
  parseDate,
} from "@/lib/finance/format";
import type {
  Financing,
  FinancingCustomPayment,
  FinancingPaymentStatus,
  FinancingRateIndex,
  FinancingType,
} from "@/lib/finance/types";
import { showSuccess } from "@/lib/ui/feedback";

type CustomPaymentDraft = {
  due_date: string;
  amount: string;
  description: string;
};

type FinancingsManagerProps = {
  financings: Financing[];
  customPayments: FinancingCustomPayment[];
  paymentStatuses: FinancingPaymentStatus[];
  monthlyIncome: number;
};

const emptyPayment = (): CustomPaymentDraft => ({
  due_date: "",
  amount: "",
  description: "",
});

function labelForType(type?: FinancingType | null) {
  return (
    FINANCING_TYPES.find((option) => option.value === (type ??"other"))
      ?.label ??"Outro"
  );
}

function labelForIndex(index?: FinancingRateIndex | null) {
  return FINANCING_RATE_INDEXES.find((option) => option.value === index)?.label;
}

export function FinancingsManager({
  financings,
  customPayments,
  paymentStatuses,
  monthlyIncome,
}: FinancingsManagerProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<Financing | null>(null);
  const [details, setDetails] = useState<Financing | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] =
    useState<FinancingType>("personal_loan");
  const [selectedRateType, setSelectedRateType] = useState("unknown");
  const [paymentDrafts, setPaymentDrafts] = useState<CustomPaymentDraft[]>([
    emptyPayment(),
  ]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const paymentsByFinancing = new Map(
    financings.map((financing) => [
      financing.id,
      customPayments.filter(
        (payment) => payment.financing_id === financing.id,
      ),
    ]),
  );
  const totalFinanced = financings.reduce(
    (sum, item) =>
      sum + Number(item.financed_amount ??item.outstanding_balance),
    0,
  );
  const currentDebt = financings.reduce(
    (sum, item) =>
      sum +
      Number(
        item.current_outstanding_balance ??
          item.outstanding_balance ??
          item.financed_amount,
      ),
    0,
  );
  const monthlyPayments = financings.reduce((sum, item) => {
    const progress = getFinancingProgress(
      item,
      paymentsByFinancing.get(item.id) ??[],
    );
    const currentPayment = progress.schedule.find(
      (entry) => entry.status === "current",
    );
    return sum + Number(currentPayment?.amount ??0);
  }, 0);
  const commitment =
    monthlyIncome > 0 ?Math.round((monthlyPayments / monthlyIncome) * 100) : 0;

  function openCreate() {
    setEditing(null);
    setSelectedType("personal_loan");
    setSelectedRateType("unknown");
    setPaymentDrafts([emptyPayment()]);
    setError("");
    setModalOpen(true);
  }

  function openEdit(item: Financing) {
    setEditing(item);
    setSelectedType(item.type ??"other");
    setSelectedRateType(item.rate_type ??"unknown");
    const existing = paymentsByFinancing.get(item.id) ??[];
    setPaymentDrafts(
      existing.length
        ? existing.map((payment) => ({
            due_date: payment.due_date,
            amount: String(payment.amount),
            description: payment.description,
          }))
        : [emptyPayment()],
    );
    setError("");
    setModalOpen(true);
  }

  function closeForm() {
    if (isPending) return;
    setModalOpen(false);
    setEditing(null);
    setError("");
  }

  function updatePayment(
    index: number,
    field: keyof CustomPaymentDraft,
    value: string,
  ) {
    setPaymentDrafts((current) =>
      current.map((payment, paymentIndex) =>
        paymentIndex === index ?{ ...payment, [field]: value } : payment,
      ),
    );
  }

  function submit(formData: FormData) {
    setError("");
    if (selectedType === "custom_plan") {
      formData.set(
        "custom_payments",
        JSON.stringify(
          paymentDrafts.map((payment) => ({
            ...payment,
            amount: Number(payment.amount),
          })),
        ),
      );
    } else {
      formData.set("custom_payments", "[]");
    }

    startTransition(async () => {
      const result = editing
        ? await updateFinancing(formData)
        : await createFinancing(formData);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setModalOpen(false);
      setEditing(null);
      showSuccess(
        editing
          ? "Financiamento ou empréstimo atualizado." : "Financiamento ou empréstimo salvo.",
      );
      router.refresh();
    });
  }

  function remove(item: Financing) {
    if (
      !window.confirm(
        `Excluir "${item.name}"? Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await deleteFinancing(item.id);
      if (!result.success) {
        setError(result.message);
        return;
      }
      showSuccess("Financiamento ou empréstimo excluído.");
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-6 flex justify-start">
        <button
          onClick={openCreate}
          className="focus-ring inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
        >
          <Plus className="size-4" /> Novo contrato
        </button>
      </div>

      {error && !modalOpen && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {financings.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Nenhum financiamento ou empréstimo cadastrado"
          description="Cadastre seu primeiro contrato para acompanhar parcelas, progresso e impacto no fluxo de caixa."
          action={
            <button
              onClick={openCreate}
              className="focus-ring rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
            >
              Cadastrar contrato
            </button>
          }
        />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="dashboard-card p-5">
              <p className="text-xs text-slate-400">
                Valor financiado líquido
              </p>
              <CurrencyValue value={totalFinanced} size="lg" className="mt-2 block font-extrabold" />
            </div>
            <div className="dashboard-card p-5">
              <p className="text-xs text-slate-400">Saldo devedor atual</p>
              <CurrencyValue value={currentDebt} size="lg" className="mt-2 block font-extrabold" />
            </div>
            <div className="dashboard-card p-5">
              <p className="text-xs text-slate-400">Renda comprometida</p>
              <p className="mt-2 text-xl font-extrabold text-amber-600">
                {commitment}%
              </p>
            </div>
          </div>

          <section className="space-y-4">
            {financings.map((item) => {
              const itemPayments = paymentsByFinancing.get(item.id) ??[];
              const progress = getFinancingProgress(item, itemPayments);
              const financedAmount = Number(
                item.financed_amount ??item.outstanding_balance,
              );
              const cet =
                item.estimated_monthly_rate !== null &&
                item.estimated_rate !== null
                  ? {
                      monthly: Number(item.estimated_monthly_rate),
                      annual: Number(item.estimated_rate),
                    }
                  : item.type !== "custom_plan"
                    ? estimateCet(
                        financedAmount,
                        Number(item.monthly_payment),
                        progress.total,
                      )
                    : null;
              const rateIndex = labelForIndex(item.rate_index);
              const itemCommitment =
                monthlyIncome > 0
                  ? Math.round(
                      (Number(item.monthly_payment) / monthlyIncome) * 100,
                    )
                  : 0;

              return (
                <article key={item.id} className="dashboard-card p-6">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                      <div className="flex items-center gap-4">
                        <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                          <FinancingTypeIcon
                            type={item.type}
                            className="size-6"
                          />
                        </span>
                        <div>
                          <h2 className="font-[var(--font-manrope)] text-lg font-extrabold">
                            {item.name}
                          </h2>
                          <p className="mt-1 text-xs text-slate-400">
                            {labelForType(item.type)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDetails(item)}
                          className="focus-ring inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold text-moss-700 hover:bg-moss-50"
                        >
                          <Eye className="size-4" /> Ver mais
                        </button>
                        <button
                          onClick={() => openEdit(item)}
                          className="focus-ring grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          aria-label={`Editar ${item.name}`}
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => remove(item)}
                          disabled={isPending}
                          className="focus-ring grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Excluir ${item.name}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">
                          Valor financiado líquido
                        </p>
                        <CurrencyValue value={financedAmount} size="sm" className="mt-1 block font-extrabold" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">
                          Saldo devedor atual
                        </p>
                        <p className="mt-1 text-sm font-extrabold">
                          {item.current_outstanding_balance !== null
                            ? <CurrencyValue value={Number(item.current_outstanding_balance)} size="sm" />
                            : "Não informado"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">
                          Parcela
                        </p>
                        <p className="mt-1 text-sm font-extrabold">
                          {item.type === "custom_plan"
                            ? "Valores personalizados" : <CurrencyValue value={Number(item.monthly_payment)} size="sm" />}
                        </p>
                        {rateIndex && (
                          <p className="mt-1 text-xs font-semibold text-moss-700">
                            {rateIndex}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">
                          Taxa CET estimada
                        </p>
                        <p className="mt-1 text-sm font-extrabold">
                          {cet
                            ?`${cet.monthly.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% a.m.`
                            : "Indisponível"}
                        </p>
                        {cet && (
                          <p className="mt-1 text-xs text-slate-400">
                            {cet.annual.toLocaleString("pt-BR", {
                              maximumFractionDigits: 2,
                            })}
                            % a.a.
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">
                          Comprometimento
                        </p>
                        <p className="mt-1 text-sm font-extrabold">
                          {itemCommitment}%
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-bold">
                          Parcela {progress.current}/{progress.total}
                        </p>
                        <p className="text-xs text-slate-400">
                          {progress.remaining} restantes
                        </p>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-moss-500 transition-all"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <button
            className="absolute inset-0"
            onClick={closeForm}
            aria-label="Fechar modal"
          />
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <button
              onClick={closeForm}
              disabled={isPending}
              className="focus-ring absolute right-5 top-5 grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
              aria-label="Fechar"
            >
              <X className="size-5" />
            </button>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-moss-600">
              {editing ?"Editar contrato" : "Novo contrato"}
            </p>
            <h2 className="mt-2 font-[var(--font-manrope)] text-2xl font-extrabold">
              Financiamento ou empréstimo
            </h2>

            <form action={submit} className="mt-7 space-y-5">
              {editing && <input type="hidden" name="id" value={editing.id} />}
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Nome</span>
                <input
                  name="name"
                  required
                  maxLength={120}
                  defaultValue={editing?.name}
                  className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Tipo</span>
                <select
                  name="type"
                  required
                  value={selectedType}
                  onChange={(event) =>
                    setSelectedType(event.target.value as FinancingType)
                  }
                  className="focus-ring h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
                >
                  {FINANCING_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Valor financiado líquido
                  </span>
                  <input
                    name="financed_amount"
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    defaultValue={
                      editing?.financed_amount ??
                      editing?.outstanding_balance ??
                      ""
                    }
                    className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Saldo devedor atual
                    <span className="ml-1 font-normal text-slate-400">
                      (opcional)
                    </span>
                  </span>
                  <input
                    name="current_outstanding_balance"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={
                      editing?.current_outstanding_balance ??""
                    }
                    className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Tipo da taxa
                  </span>
                  <select
                    name="rate_type"
                    required
                    value={selectedRateType}
                    onChange={(event) =>
                      setSelectedRateType(event.target.value)
                    }
                    className="focus-ring h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
                  >
                    {FINANCING_RATE_TYPES.map((rate) => (
                      <option key={rate.value} value={rate.value}>
                        {rate.label}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedRateType === "variable" && (
                  <label>
                    <span className="mb-2 block text-sm font-semibold">
                      Índice
                    </span>
                    <select
                      name="rate_index"
                      required
                      defaultValue={editing?.rate_index ??""}
                      className="focus-ring h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
                    >
                      <option value="" disabled>
                        Selecione
                      </option>
                      {FINANCING_RATE_INDEXES.map((index) => (
                        <option key={index.value} value={index.value}>
                          {index.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              {selectedType === "custom_plan" ? (
                <section className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-extrabold">
                        Vencimentos personalizados
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Cada registro será lançado no fluxo de caixa na data informada.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPaymentDrafts((current) => [
                          ...current,
                          emptyPayment(),
                        ])
                      }
                      className="focus-ring inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold"
                    >
                      <Plus className="size-3.5" /> Adicionar
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {paymentDrafts.map((payment, index) => (
                      <div
                        key={index}
                        className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_1.4fr_auto]"
                      >
                        <input
                          aria-label={`Data do vencimento ${index + 1}`}
                          type="date"
                          required
                          value={payment.due_date}
                          onChange={(event) =>
                            updatePayment(index, "due_date", event.target.value)
                          }
                          className="focus-ring h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                        />
                        <input
                          aria-label={`Valor do vencimento ${index + 1}`}
                          type="number"
                          min="0.01"
                          step="0.01"
                          required
                          placeholder="Valor"
                          value={payment.amount}
                          onChange={(event) =>
                            updatePayment(index, "amount", event.target.value)
                          }
                          className="focus-ring h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                        />
                        <input
                          aria-label={`Descrição do vencimento ${index + 1}`}
                          required
                          maxLength={120}
                          placeholder="Descrição"
                          value={payment.description}
                          onChange={(event) =>
                            updatePayment(
                              index,
                              "description",
                              event.target.value,
                            )
                          }
                          className="focus-ring h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                        />
                        <button
                          type="button"
                          disabled={paymentDrafts.length === 1}
                          onClick={() =>
                            setPaymentDrafts((current) =>
                              current.filter(
                                (_, paymentIndex) => paymentIndex !== index,
                              ),
                            )
                          }
                          className="grid size-11 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                          aria-label={`Remover vencimento ${index + 1}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              ) : (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">
                      Valor da parcela mensal
                    </span>
                    <input
                      name="monthly_payment"
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      defaultValue={editing?.monthly_payment}
                      className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm"
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label>
                      <span className="mb-2 block text-sm font-semibold">
                        Data de início
                      </span>
                      <input
                        name="start_date"
                        required
                        type="date"
                        defaultValue={editing?.start_date ??""}
                        className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm"
                      />
                    </label>
                    <label>
                      <span className="mb-2 block text-sm font-semibold">
                        Data de fim
                      </span>
                      <input
                        name="end_date"
                        required
                        type="date"
                        defaultValue={editing?.end_date ??""}
                        className="focus-ring h-12 w-full rounded-xl border border-slate-200 px-4 text-sm"
                      />
                    </label>
                  </div>
                </>
              )}

              {editing && (!editing.start_date || !editing.end_date) && (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                  Este é um registro antigo. Complete os dados para ativar o
                  calendário detalhado.
                </p>
              )}
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={isPending}
                className="focus-ring h-12 w-full rounded-xl bg-slate-900 text-sm font-bold text-white disabled:opacity-60"
              >
                {isPending
                  ? "Salvando..." : editing
                    ? "Salvar alterações" : "Cadastrar contrato"}
              </button>
            </form>
          </div>
        </div>
      )}

      {details && (
        <FinancingDetails
          financing={details}
          customPayments={paymentsByFinancing.get(details.id) ??[]}
          paymentStatuses={paymentStatuses.filter((status) => status.financing_id === details.id)}
          onClose={() => setDetails(null)}
        />
      )}
    </>
  );
}

function FinancingDetails({
  financing,
  customPayments,
  paymentStatuses,
  onClose,
}: {
  financing: Financing;
  customPayments: FinancingCustomPayment[];
  paymentStatuses: FinancingPaymentStatus[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const progress = getFinancingProgress(financing, customPayments);
  const financedAmount = Number(
    financing.financed_amount ??financing.outstanding_balance,
  );
  const cet =
    financing.estimated_monthly_rate !== null &&
    financing.estimated_rate !== null
      ? {
          monthly: Number(financing.estimated_monthly_rate),
          annual: Number(financing.estimated_rate),
        }
      : financing.type !== "custom_plan"
        ? estimateCet(
            financedAmount,
            Number(financing.monthly_payment),
            progress.total,
          )
        : null;
  const statusLabels = {
    past: "Vencida",
    current: "Atual",
    future: "Prevista",
  };
  const paidDates = new Set(
    paymentStatuses.filter((status) => status.paid).map((status) => status.due_date),
  );
  const overdueDates = progress.schedule
    .filter((entry) => entry.status === "past" && !paidDates.has(entry.dueDate))
    .map((entry) => entry.dueDate);
  const togglePaid = (dueDate: string, paid: boolean) =>
    startTransition(async () => {
      const result = await setFinancingPaymentPaid(financing.id, dueDate, paid);
      if (result.success) router.refresh();
    });
  const markAll = () =>
    startTransition(async () => {
      const result = await markOverdueFinancingPaymentsPaid(financing.id, overdueDates);
      if (result.success) router.refresh();
    });

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-slate-950/50 backdrop-blur-sm">
      <button
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Fechar detalhes"
      />
      <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl sm:p-8">
        <button
          onClick={onClose}
          className="focus-ring absolute right-5 top-5 grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
          aria-label="Fechar"
        >
          <X className="size-5" />
        </button>
        <div className="flex items-center gap-4 pr-12">
          <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
            <FinancingTypeIcon type={financing.type} className="size-6" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-moss-600">
              {labelForType(financing.type)}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold">{financing.name}</h2>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Detail label="Valor financiado líquido" value={<CurrencyValue value={financedAmount} size="sm" />} />
          <Detail
            label="Saldo devedor atual"
            value={
              financing.current_outstanding_balance !== null
                ? <CurrencyValue value={Number(financing.current_outstanding_balance)} size="sm" />
                : "Não informado"
            }
          />
          <Detail
            label="Parcela"
            value={
              financing.type === "custom_plan"
                ? "Valores personalizados" : <CurrencyValue value={Number(financing.monthly_payment)} size="sm" />
            }
          />
          <Detail
            label="Taxa CET estimada"
            value={
              cet
                ?`${cet.monthly.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% a.m. · ${cet.annual.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% a.a.`
                : "Taxa CET estimada indisponível"
            }
          />
          <Detail
            label="Índice"
            value={labelForIndex(financing.rate_index) ??"Não informado"}
          />
          <Detail
            label="Período"
            value={
              financing.start_date && financing.end_date
                ? `${dateFormatter.format(parseDate(financing.start_date))} até ${dateFormatter.format(parseDate(financing.end_date))}`
                : "Datas não informadas"
            }
          />
        </div>

        <div className="mt-7 rounded-2xl bg-slate-50 p-5">
          <div className="flex items-center justify-between">
            <p className="font-extrabold">
              Parcela {progress.current}/{progress.total}
            </p>
            <p className="text-xs text-slate-500">
              {progress.remaining} restantes
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-moss-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-extrabold">Cronograma previsto</h3>
          <p className="mt-1 text-xs text-slate-400">
            Calendário contratual sem cálculo de amortização.
          </p>
          {overdueDates.length > 0 && (
            <button onClick={markAll} disabled={pending} className="mt-4 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
              Marcar todas as vencidas como pagas
            </button>
          )}
          <div className="mt-4 rounded-2xl border border-slate-200">
            <div className="hidden grid-cols-[.7fr_1fr_1fr_.9fr] gap-3 bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:grid">
              <span>Parcela</span>
              <span>Data</span>
              <span>Valor</span>
              <span>Status</span>
            </div>
            <div className="max-h-[45vh] divide-y divide-slate-100 overflow-y-auto">
              {progress.schedule.map((entry) => {
                const paid = paidDates.has(entry.dueDate);
                return (
                <div
                  key={`${entry.number}-${entry.dueDate}`}
                  className={`grid min-w-0 grid-cols-2 items-center gap-3 px-4 py-3 text-sm transition sm:grid-cols-[.7fr_1fr_1fr_.9fr] ${
                    paid
                      ? "bg-emerald-50/80" : entry.status === "past"
                        ? "bg-amber-50/70" : "bg-white"
                  }`}
                >
                  <span className="font-bold">{entry.number}</span>
                  <span>{dateFormatter.format(parseDate(entry.dueDate))}</span>
                  <CurrencyValue value={entry.amount} size="sm" className="font-semibold" />
                  {entry.status === "past" ? (
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={paid}
                        disabled={pending}
                        onChange={(event) => togglePaid(entry.dueDate, event.target.checked)}
                        className="peer sr-only"
                      />
                      <span className="grid size-5 shrink-0 place-items-center rounded-md border border-amber-300 bg-white text-transparent transition peer-checked:border-emerald-500 peer-checked:bg-emerald-500 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-moss-500 peer-focus-visible:ring-offset-2">
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                      <span className={`text-xs font-bold ${paid ?"text-emerald-700" : "text-amber-700"}`}>
                        {paid ?"Paga" : "Vencida"}
                      </span>
                    </label>
                  ) : (
                    <span className={entry.status === "current" ?"font-bold text-moss-700" : "text-slate-500"}>
                      {statusLabels[entry.status]}
                    </span>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-extrabold">{value}</p>
    </div>
  );
}
