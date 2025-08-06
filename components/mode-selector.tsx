'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type AppMode = 'edumate' | 'resources';

export function ModeSelector() {
  const pathname = usePathname();
  const currentMode: AppMode = pathname.startsWith('/resources') ? 'resources' : 'edumate';

  const baseClasses = "flex-1 text-center px-6 py-4 rounded-lg font-bold text-lg transition-all duration-300";
  const activeClasses = "bg-white dark:bg-gray-800 shadow-lg text-indigo-600 dark:text-indigo-300";
  const inactiveClasses = "bg-transparent text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50";

  return (
    <div className="max-w-md mx-auto my-8 p-2 bg-gray-100 dark:bg-gray-800/60 rounded-xl flex items-center space-x-2 border border-gray-200 dark:border-gray-700">
        <Link href="/edumate" className={`${baseClasses} ${currentMode === 'edumate' ? activeClasses : inactiveClasses}`}>
            <div>
              <span className="block text-xl">🎓</span>
              <span className="block mt-1 text-sm">VTU EduMate</span>
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
