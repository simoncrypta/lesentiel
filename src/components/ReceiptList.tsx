import { TextAttributes } from "@opentui/core";
import { For } from "solid-js";

type ReceiptListProps = {
  receipts: readonly string[];
};

export function ReceiptList(props: ReceiptListProps) {
  const count = props.receipts.length;

  return (
    <box border padding={1} flexGrow={1} flexDirection="column">
      <text attributes={TextAttributes.BOLD} marginBottom={1}>
        Receipts ({count}):
      </text>
      {count > 0 ? (
        <For each={props.receipts}>
          {(filename) => <text attributes={TextAttributes.DIM}>{filename}</text>}
        </For>
      ) : (
        <text attributes={TextAttributes.DIM}>No receipts yet</text>
      )}
    </box>
  );
}
