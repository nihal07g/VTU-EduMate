'use client'

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function ModeSelector() {
  const pathname = usePathname();
  const currentMode = pathname.startsWith('/resources') ? 'resources' : 'edumate';

  const baseClasses = "flex-1 text-center px-6 py-4 rounded-lg font-bold text-lg transition-all duration-300";
  const activeClasses = "bg-white dark:bg-gray-800 shadow-lg text-indigo-600 dark:text-indigo-300";
  const inactiveClasses = "bg-transparent text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50";

  return (
    <div className="max-w-md mx-auto my-8 p-2 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center space-x-2 border border-gray-200 dark:border-gray-700">
        <Link href="/edumate" className={`${baseClasses} ${currentMode === 'edumate' ? activeClasses : inactiveClasses}`}>
            <div>
              <div className="flex justify-center mb-1">
                <div className="w-8 h-8 rounded-full overflow-hidden shadow-lg">
                  <Image 
                    src="/logo.png" 
                    alt="VTU EduMate Logo" 
                    width={32}
                    height={32}
                    className="w-8 h-8 object-cover"
                  />
                </div>
              </div>
              <span className="block text-sm">VTU EduMate</span>
            </div>
        </Link>
        <Link href="/resources" className={`${baseClasses} ${currentMode === 'resources' ? activeClasses : inactiveClasses}`}>
            <div>
                <span className="block text-xl">📚</span>
                <span className="block mt-1 text-sm">VTU Resources</span>
            </div>
        </Link>
    </div>
  );
}
