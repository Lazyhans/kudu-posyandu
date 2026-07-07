import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Halaman tidak ditemukan</h2>
        <div className="mt-6">
          <Link to="/" className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "root" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Terjadi kesalahan</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Coba lagi
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: "Digitalisasi Administrasi Posyandu Kelurahan Kudu" },
      { name: "description", content: "Aplikasi digitalisasi pencatatan tumbuh kembang balita oleh kader Posyandu Kelurahan Kudu." },
      { name: "theme-color", content: "#2b8a8a" },
      { property: "og:title", content: "Digitalisasi Administrasi Posyandu Kelurahan Kudu" },
      { property: "og:description", content: "Aplikasi digitalisasi pencatatan tumbuh kembang balita oleh kader Posyandu Kelurahan Kudu." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Digitalisasi Administrasi Posyandu Kelurahan Kudu" },
      { name: "twitter:description", content: "Aplikasi digitalisasi pencatatan tumbuh kembang balita oleh kader Posyandu Kelurahan Kudu." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/iCPK8FUsaxYlEFRmkumqEYlYJd82/social-images/social-1783442848979-Gemini_Generated_Image_a2cziva2cziva2cz.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/iCPK8FUsaxYlEFRmkumqEYlYJd82/social-images/social-1783442848979-Gemini_Generated_Image_a2cziva2cziva2cz.webp" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
