import { Loader2 } from 'lucide-react';

// LoaderProps structure:
// {
//   message: string
// }

export function Loader({ message }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-12 px-8">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 rounded-full animate-spin">
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">E</span>
          </div>
        </div>
      </div>
      
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
          {message}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          Processing with VTU-trained Python ML models
        </p>
        
        <div className="flex items-center justify-center space-x-3 text-xs text-slate-400 dark:text-slate-500 mt-4">
          <span className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span>Random Forest</span>
          </span>
          <span className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
            <span>SVM</span>
          </span>
          <span className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
            <span>TF-IDF</span>
          </span>
        </div>
      </div>
    </div>
  );
}
