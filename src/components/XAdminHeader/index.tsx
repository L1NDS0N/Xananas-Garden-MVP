import Link from 'next/link';
import XAdminProfile from '../XAdminProfile';

export default function XAdminHeader() {
  return (
    <div className="flex flex-1 bg-zinc-100 justify-between h-20 items-center p-4">
      <div>
        <Link href="/admin/dashboard">
          <h1 className="font-gloria text-xanana-100 text-xl cursor-pointer">
            Xananas’ Garden
          </h1>
        </Link>
      </div>
      <XAdminProfile />
    </div>
  );
};

