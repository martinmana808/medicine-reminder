import Link from "next/link";
import { MedicineForm } from "@/components/MedicineForm";
import { getLanguage } from "@/lib/repo";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Add medicine" };

export default async function AddPage() {
  const lang = await getLanguage();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-slate-400 hover:text-slate-700">
          ←
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t(lang, "add.title")}
        </h1>
      </div>
      <MedicineForm lang={lang} />
    </div>
  );
}
