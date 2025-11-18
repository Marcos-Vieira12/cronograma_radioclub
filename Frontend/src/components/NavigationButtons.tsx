interface INavigationButtonsProps {
  nextvisible?: boolean;
  prevvisible?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  nextLabel?: string;
  backLabel?: string;
}
export function NavigationButtons(props: INavigationButtonsProps) {
    return (
        <div
  style={{
    display: "flex",
    alignItems: "center",
    width: "100%",
    marginTop: "20px",
    justifyContent: props.prevvisible && props.nextvisible
      ? "space-between"
      : props.nextvisible
      ? "flex-end"
      : "flex-start",
  }}
>
  {props.prevvisible && (
    <button type="button" onClick={props.onPrev || (() => {})}>
      {props.backLabel || "Voltar"}
    </button>
  )}

  {props.nextvisible && (
    <button type="submit">
      {props.nextLabel || "Próximo"}
    </button>
  )}
</div>

    );
}