import Link from "next/link";
import { MedicineForm } from "@/components/MedicineForm";

export const metadata = { title: "Add medicine" };

export default function AddPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-slate-400 hover:text-slate-700">
          ←
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Add medicine
        </h1>
      </div>
      <MedicineForm />
    </div>
  );
}
