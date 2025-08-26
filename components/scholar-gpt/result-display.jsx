import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FileText, BookOpen, Layers, Star, Bot, ExternalLink, Copy, Check } from 'lucide-react';
import { getOfficialVTULink } from '@/utils/vtuCodeValidator';

// ResultDisplayProps structure:
// {
//   result: any,
//   onMarksSubmit: (marks) => void
// }

export function ResultDisplay({ result, onMarksSubmit }) {
    const [marks, setMarks] = useState('');
    const [copied, setCopied] = useState(false);

    if (!result || result.error) {
        return null;
    }

    const { subjectName, subjectCode, moduleTitle, reference, answer, prompt, awaitingMarks } = result;

        const handleMarksInputChange = (e) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) { 
            setMarks(value);
        }
    };
    
        const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitMarks();
        }
    }
    
    const submitMarks = () => {
        const marksValue = parseInt(marks, 10);
        if (!isNaN(marksValue) && marksValue > 0) {
            onMarksSubmit(marksValue);
        }
    }

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(answer);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const vtuCircleLink = getOfficialVTULink(subjectCode);

  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 overflow-hidden animate-fade-in">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span>AI Response</span>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyToClipboard}
            className="hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-start space-x-3">
            <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Subject Match</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{subjectName} ({subjectCode})</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{moduleTitle}</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Reference</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{reference}</p>
              <Button variant="outline" size="sm" asChild className="mt-2">
                <a href={vtuCircleLink} target="_blank" rel="noopener noreferrer" className="text-xs">
                  VTU Circle <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        </div>
       
        <div className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50 overflow-hidden">
          <div className="p-4 bg-emerald-100/50 dark:bg-emerald-900/30 border-b border-emerald-200/50 dark:border-emerald-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-emerald-800 dark:text-emerald-200">VTU EduMate Answer</h4>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Custom GPT • Python ML • Research Grade</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: answer
                    .replace(/\n/g, '<br />')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                }}
              />
            </div>
          </div>
        </div>

        {awaitingMarks && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-600 p-4 animate-fade-in">
            <div className="flex items-center space-x-3 mb-3">
              <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-200">Customize Answer Length</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">Enter marks (e.g., 2, 5, 10) to adjust answer detail</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Input 
                type="text" 
                placeholder="Enter marks..." 
                value={marks} 
                onChange={handleMarksInputChange}
                onKeyDown={handleKeyDown}
                className="max-w-xs bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-600 focus:ring-amber-500"
              />
              <Button 
                onClick={submitMarks}
                disabled={!marks}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              >
                Adjust Answer
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-800">
                <FileText className="mr-2 h-4 w-4" />
                View Prompt Details
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">AI Prompt Details</DialogTitle>
              </DialogHeader>
              <div className="mt-4 space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  This is the exact prompt sent to the AI model to generate the response.
                </p>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 text-sm font-mono whitespace-pre-wrap max-h-[50vh] overflow-y-auto border">
                  {prompt}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Python ML Processed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
