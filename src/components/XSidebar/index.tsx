import Link from "next/link";

interface ISidebarProps {
  title: string; 
  items: {
    name: string;
    href: string;
  }[]
}

export default function XSidebar({title, items}: ISidebarProps) {
  return (
    <div className={"flex h-full w-full pt-6 max-w-[12rem] mx-2"}>
      <div className="flex flex-1 flex-col items-center">
          <h1 className="font-bold text-xl">{title}</h1>
          <div className="leading-relaxed">
            {
              items.map((item) => {
                return (
                    <Link className="flex my-2 border-solid border-b border-transparent hover:border-zinc-300" href={item.href} >{item.name}</Link>
                )
              })
            }
          </div>
        </div>
      </div>
  );
}
