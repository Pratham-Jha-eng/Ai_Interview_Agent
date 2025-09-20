import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { INDUSTRY_TOPICS, CASE_STUDY_TYPES } from '../constants';
import LoadingSpinner from './LoadingSpinner';

// Set the worker source for pdf.js once. This is required for the library to work correctly.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

interface SelectionScreenProps {
  onStartWithTopic: (topic: string) => void;
  onStartWithGeneratedCase: (caseType: string) => void;
  onStartWithUpload: (content: string) => void;
  isLoading: boolean;
  error: string | null;
}

type Tab = 'topic' | 'generate' | 'upload';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
      active
        ? 'bg-cyan-500 text-white'
        : 'bg-gray-700 text-slate-300 hover:bg-gray-600'
    }`}
  >
    {children}
  </button>
);

const SelectionScreen: React.FC<SelectionScreenProps> = ({ 
  onStartWithTopic, 
  onStartWithGeneratedCase, 
  onStartWithUpload, 
  isLoading, 
  error 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('topic');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedCaseType, setSelectedCaseType] = useState<string>('');
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isParsingPdf, setIsParsingPdf] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setFileContent(null);
    setFileName('');
    setUploadError(null);

    if (file.type === 'text/plain' || file.name.endsWith('.md')) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setFileContent(text);
      };
      reader.readAsText(file);
    } else if (file.type === 'application/pdf') {
        setFileName(file.name);
        setIsParsingPdf(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                if (!arrayBuffer) {
                    throw new Error("Could not read file into buffer.");
                }
                const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                const pageTexts = await Promise.all(
                    Array.from({ length: pdf.numPages }, (_, i) => i + 1).map(async (pageNumber) => {
                        const page = await pdf.getPage(pageNumber);
                        const textContent = await page.getTextContent();
                        return textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
                    })
                );
                setFileContent(pageTexts.join('\n\n'));
            } catch (err) {
                console.error("Error parsing PDF:", err);
                setUploadError("Failed to parse the PDF file. It might be corrupted or protected.");
            } finally {
                setIsParsingPdf(false);
            }
        };
        reader.onerror = () => {
            setUploadError("Failed to read the selected file.");
            setIsParsingPdf(false);
        };
        reader.readAsArrayBuffer(file);
    } else {
      setUploadError('Please select a valid .txt, .md, or .pdf file.');
    }
  };
    
  const handleUploadStart = () => {
    if (fileContent) {
      onStartWithUpload(fileContent);
    }
  };
  
  const isUploadProcessing = isLoading || isParsingPdf;
  const currentLoadingMessage = isParsingPdf ? 'Parsing PDF...' : 'Preparing your interview...';

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-full">
          <LoadingSpinner />
          <p className="mt-4 text-slate-300">{currentLoadingMessage}</p>
        </div>
      )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <div className="w-full max-w-xl">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Choose Your Practice Mode</h2>
        <p className="text-slate-400 mb-8">How would you like to start your case interview?</p>

        <div className="flex justify-center gap-2 mb-6 p-1 bg-[#2D2D2D] rounded-lg">
          <TabButton active={activeTab === 'topic'} onClick={() => setActiveTab('topic')}>Standard Case</TabButton>
          <TabButton active={activeTab === 'generate'} onClick={() => setActiveTab('generate')}>Generate Case</TabButton>
          <TabButton active={activeTab === 'upload'} onClick={() => setActiveTab('upload')}>Upload Casebook</TabButton>
        </div>

        <div className="min-h-[160px]">
          {activeTab === 'topic' && (
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Choose an Industry Topic:</h3>
              <div className="relative w-full max-w-sm">
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full appearance-none bg-gray-700 border border-gray-600 text-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition cursor-pointer"
                >
                  <option value="" disabled>Select a topic...</option>
                  {INDUSTRY_TOPICS.map((topic) => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
              <button
                onClick={() => onStartWithTopic(selectedTopic)}
                disabled={!selectedTopic || isLoading}
                className="w-full max-w-sm px-4 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-500 transition-colors shadow-md disabled:bg-gray-700 disabled:cursor-not-allowed"
              >
                Start Interview
              </button>
            </div>
          )}
          {activeTab === 'generate' && (
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Choose a Case Type to Generate:</h3>
              <div className="relative w-full max-w-sm">
                <select
                  value={selectedCaseType}
                  onChange={(e) => setSelectedCaseType(e.target.value)}
                  className="w-full appearance-none bg-gray-700 border border-gray-600 text-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition cursor-pointer"
                >
                  <option value="" disabled>Select a case type...</option>
                  {CASE_STUDY_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
              <button
                onClick={() => onStartWithGeneratedCase(selectedCaseType)}
                disabled={!selectedCaseType || isLoading}
                className="w-full max-w-sm px-4 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-500 transition-colors shadow-md disabled:bg-gray-700 disabled:cursor-not-allowed"
              >
                Generate & Start
              </button>
            </div>
          )}
          {activeTab === 'upload' && (
             <div className="flex flex-col items-center gap-4">
              <h3 className="text-lg font-semibold text-slate-200">Upload Your Casebook:</h3>
              <p className="text-sm text-slate-400 -mt-2">(.txt, .md, or .pdf files accepted)</p>
              <label className="w-full max-w-sm cursor-pointer bg-gray-700 text-slate-300 rounded-lg p-4 text-center border-2 border-dashed border-gray-600 hover:border-cyan-500 hover:bg-gray-600 transition-colors">
                <input type="file" className="hidden" onChange={handleFileChange} accept=".txt,.md,.pdf" />
                <span>{fileName || 'Click to select a file'}</span>
              </label>
               {uploadError && <p className="text-red-400 text-sm">{uploadError}</p>}
              <button onClick={handleUploadStart} disabled={!fileContent || isUploadProcessing} className="w-full max-w-sm px-4 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-500 transition-colors shadow-md disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {isParsingPdf && <LoadingSpinner />}
                  {isParsingPdf ? 'Parsing PDF...' : 'Start with this Casebook'}
              </button>
            </div>
          )}
        </div>

        {error && <p className="mt-6 text-red-400">{error}</p>}
      </div>
    </div>
  );
};

export default SelectionScreen;