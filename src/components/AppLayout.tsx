import { Header } from "./Header.tsx";
import { ReceiptList } from "./ReceiptList.tsx";
import { Footer } from "./Footer.tsx";

type AppLayoutProps = {
  receipts: readonly string[];
  footerMessage: string;
};

export function AppLayout(props: AppLayoutProps) {
  return (
    <box flexDirection="column" flexGrow={1} padding={2}>
      <Header />
      <ReceiptList receipts={props.receipts} />
      <Footer message={props.footerMessage} />
    </box>
  );
}
