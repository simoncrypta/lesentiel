import { TextAttributes } from "@opentui/core";

type FooterProps = {
  message: string;
};

export function Footer(props: FooterProps) {
  return (
    <box position="absolute" bottom={1} left={2} right={2}>
      <text attributes={TextAttributes.DIM}>{props.message}</text>
    </box>
  );
}
