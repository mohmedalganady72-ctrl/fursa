import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminSearch({ defaultValue = "", placeholder }: { defaultValue?: string; placeholder: string }) {
  return <form method="get" className="mt-5 flex max-w-xl gap-2" role="search">
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <Input name="q" defaultValue={defaultValue} placeholder={placeholder} className="ps-10" />
    </div>
    <Button type="submit">بحث</Button>
  </form>;
}
