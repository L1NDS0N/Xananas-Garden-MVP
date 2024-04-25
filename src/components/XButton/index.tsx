enum EButtonType {
	Primary,
	Secondary,
}
type TButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	xType: 'Primary' | 'Secondary';
	xTitle?: string;
};

export default function XButton({ xType, xTitle, ...inherited }: TButtonProps) {
	const buttonTypeStilization = [
		'bg-[#de818dcc] hover:bg-[#de818d] text-white',
		'bg-zinc-700 hover:bg-zinc-600 text-white',
	][EButtonType[xType]];
	return (
		<button
			className={`rounded-sm p-1 h-10 ${buttonTypeStilization}`}
			aria-label={'Botão ' + xTitle}
			title={xTitle}
			{...inherited}>
			{xTitle}
		</button>
	);
}
