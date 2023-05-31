export default function Sidebar() {
  return (
    <div className={"flex h-full max-w-xs pt-6 lg:ml-24"}>
      <div className="flex flex-col p-2 items-center">
        <div>
          <h1 className="font-bond text-xl">Categorias</h1>
          <ul className="flex flex-col pl-2 leading-relaxed">
            <li>
              <a href="#">Tudo</a>
            </li>
            <li>
              <a href="#">Rosas do deserto</a>
            </li>
            <li>
              <a href="#">Vasos plásticos</a>
            </li>
            <li>
              <a href="#">Vasos de cimento</a>
            </li>
            <li>
              <a href="#">Fertilizantes</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
