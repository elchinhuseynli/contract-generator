import Link from "next/link";
import { FileText, FolderOpen, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    icon: FileText,
    title: "Generátor smluv",
    description:
      "Smlouva o dílo s automatickým doplněním údajů z registru ARES podle IČO.",
  },
  {
    icon: FolderOpen,
    title: "Správa dokumentů",
    description:
      "Ukládejte, upravujte, duplikujte a archivujte smlouvy na jednom místě.",
  },
  {
    icon: ShieldCheck,
    title: "Stavy a verze",
    description:
      "Sledujte stav (koncept → odesláno → podepsáno) a historii každé úpravy.",
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <FileText className="size-4" />
            </span>
            Contract DMS
          </div>
          <ThemeToggle />
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          Flex Digital Agency · v2
        </span>
        <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Generujte a spravujte smlouvy o dílo
        </h1>
        <p className="mt-4 max-w-xl text-balance text-lg text-muted-foreground">
          Profesionální nástroj pro tvorbu českých smluv s napojením na ARES,
          správou dokumentů, exportem do PDF a verzováním.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/contracts/new" />}
          >
            Vytvořit smlouvu
          </Button>
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="/dashboard" />}
          >
            Otevřít přehled
          </Button>
        </div>

        <div className="mt-16 grid w-full gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="text-left">
              <CardHeader>
                <f.icon className="size-5 text-primary" />
                <CardTitle className="mt-2 text-base">{f.title}</CardTitle>
                <CardDescription>{f.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto w-full max-w-6xl px-6 py-6 text-sm text-muted-foreground">
          © 2026 Flex Digital Agency, s.r.o.
        </div>
      </footer>
    </main>
  );
}
