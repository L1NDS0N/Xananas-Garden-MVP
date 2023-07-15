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
    <div className={"flex h-full max-w-xs pt-6 lg:ml-24"}>
      <div className="flex flex-col p-2 items-center">
        <div>
          <h1 className="font-bond text-xl">{title}</h1>
          <ul className="flex flex-col pl-2 leading-relaxed">
            {
              items.map((item) => {
                return (
                  <li>
                    <Link href={item.href}>{item.name}</Link>
                  </li>
                )
              })
            }
          </ul>
        </div>
      </div>
    </div>
  );
}
