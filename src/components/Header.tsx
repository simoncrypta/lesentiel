import { TextAttributes } from "@opentui/core";

type HeaderProps = {
  subtitle?: string | undefined;
};

export function Header(props: HeaderProps) {
  return (
    <box marginBottom={2} flexDirection="column">
      <ascii_font font="tiny" text="Receipt Manager" />
      {props.subtitle ? (
        <text attributes={TextAttributes.DIM}>{props.subtitle}</text>
      ) : null}
    </box>
  );
}
