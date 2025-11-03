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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', alignContent: 'center' }}>
            {props.prevvisible && (<button type = "button" onClick={props.onPrev || (() => {})}>
                {props.backLabel || 'Voltar'}
            </button>
            )}
            {props.nextvisible && (
                <button type = "submit">
                    {props.nextLabel || 'Próximo'}
                </button>
            )}
        </div>
    );
}