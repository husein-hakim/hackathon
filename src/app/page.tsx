import { ApplicationShell } from "@/components/secondlook/ApplicationShell";
import { ToastProvider } from "@/components/ui/Toast";

export default function Home() {
  return (
    <ToastProvider>
      <ApplicationShell />
    </ToastProvider>
  );
}
