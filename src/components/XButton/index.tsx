enum EButtonType {
	Primary,
	Secondary,
}
type TButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	xType: 'Primary' | 'Secondary';
	xTitle?: string;
};

export function XButton({ xType, xTitle, ...inherited }: TButtonProps) {
	const buttonTypeStilization = [
		'bg-[#de818dcc] hover:bg-[#de818d] text-white',
	][EButtonType[xType]];
	return (
		<button
			className={`rounded-sm h-10 ${buttonTypeStilization}`}
			aria-label={'Botão ' + xTitle}
			title={xTitle}
			{...inherited}>
			{xTitle}
		</button>
	);
}
