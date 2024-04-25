
export type ISidebarItemProps = {
  name: string;
  href?: string;
}
interface ISidebarProps {
  title: string;
  onSelect?: (item: ISidebarItemProps) => void;
  items: ISidebarItemProps[];
}

export default function XSidebar({ title, items, onSelect }: ISidebarProps) {
  return (
    <div className={"flex h-full w-full pt-6 max-w-[12rem] mx-2"}>
      <div className="flex flex-1 flex-col items-center">
        <h1 className="font-bold text-xl">{title}</h1>
        <div className="leading-relaxed">
          {
            items.map((item, index) => {
              return (
                <div key={index} className="flex my-2 border-solid border-b border-transparent hover:border-zinc-300"
                  onClick={() => onSelect ? onSelect(item) : null}>{item.name}</div>
              )
            })
          }
        </div>
      </div>
    </div>
  );
}
