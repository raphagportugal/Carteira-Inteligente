"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { updateUserProfile } from "@/app/dashboard/actions";
import { showSuccess } from "@/lib/ui/feedback";

const avatarThemês = {
  teal: "bg-moss-100 text-moss-700",
  slate: "bg-slate-900 text-white",
  gold: "bg-amber-100 text-amber-800",
  rose: "bg-rose-100 text-rose-700",
} as const;

export function ProfileMenu({ name, avatar }: { name: string; avatar: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<keyof typeof avatarThemês>(
    avatar in avatarThemês ?avatar as keyof typeof avatarThemês : "teal",
  );
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const initial = name.slice(0, 1).toUpperCase() || "C";

  function submit(formData: FormData) {
    formData.set("avatar", selected);
    startTransition(async () => {
      const result = await updateUserProfile(formData);
      if (!result.success) return setError(result.message);
      setOpen(false);
      showSuccess("Perfil atualizado.");
      router.refresh();
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={`focus-ring grid size-10 place-items-center rounded-full text-sm font-extrabold ${avatarThemês[selected]}`} aria-label="Abrir perfil">
        {initial}
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <button className="absolute inset-0" onClick={() => setOpen(false)} aria-label="Fechar perfil" />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <button onClick={() => setOpen(false)} className="absolute right-5 top-5 text-slate-400"><X className="size-5" /></button>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-moss-600">Perfil</p>
            <h2 className="mt-2 text-2xl font-extrabold">Sua identidade no app</h2>
            <form action={submit} className="mt-6 space-y-5">
              <label className="block"><span className="mb-2 block text-sm font-semibold">Nome de exibição</span><input name="name" required minLength={2} maxLength={80} defaultValue={name} className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm" /></label>
              <div><span className="mb-3 block text-sm font-semibold">Avatar padrão</span><div className="grid grid-cols-4 gap-3">{Object.entries(avatarThemês).map(([key, classes]) => <button key={key} type="button" onClick={() => setSelected(key as keyof typeof avatarThemês)} className={`grid size-12 place-items-center rounded-2xl text-sm font-extrabold ring-offset-2 ${classes} ${selected === key ?"ring-2 ring-moss-500" : ""}`}>{initial}</button>)}</div></div>
              {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <button disabled={pending} className="h-12 w-full rounded-xl bg-slate-900 text-sm font-bold text-white disabled:opacity-60">{pending ?"Salvando..." : "Salvar perfil"}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
