import React, { useState, useRef } from 'react';
import { 
  FolderPlus, 
  FileCode, 
  FileText, 
  Trash2, 
  Eye, 
  X, 
  Terminal, 
  UploadCloud,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ProjectFile } from '../types';

interface ProjectCodebaseInspectorProps {
  projectFiles: ProjectFile[];
  onAddFiles: (files: ProjectFile[]) => void;
  onRemoveFile: (path: string) => void;
  onClearFiles: () => void;
}

export const ProjectCodebaseInspector: React.FC<ProjectCodebaseInspectorProps> = ({
  projectFiles,
  onAddFiles,
  onRemoveFile,
  onClearFiles,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [manualPath, setManualPath] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const allowedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.sql', '.py', '.go', '.rs', '.java', '.yaml', '.yml', '.md', '.env.example'];
    const loaded: ProjectFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.webkitRelativePath.includes('node_modules/') || file.webkitRelativePath.includes('.git/') || file.webkitRelativePath.includes('dist/')) {
        continue;
      }

      const hasAllowedExt = allowedExtensions.some(ext => file.name.endsWith(ext));
      if (!hasAllowedExt) continue;

      if (file.size > 300 * 1024) continue;

      try {
        const text = await file.text();
        loaded.push({
          path: file.webkitRelativePath || file.name,
          name: file.name,
          content: text,
          size: file.size,
          language: getLanguage(file.name),
        });
      } catch (err) {
        console.error('Failed reading file:', file.name, err);
      }
    }

    if (loaded.length > 0) {
      onAddFiles(loaded);
      setIsOpen(true);
    }
  };

  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const loaded: ProjectFile[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > 300 * 1024) continue;
      try {
        const text = await file.text();
        loaded.push({
          path: file.name,
          name: file.name,
          content: text,
          size: file.size,
          language: getLanguage(file.name),
        });
      } catch (err) {
        console.error('Failed reading file:', file.name, err);
      }
    }

    if (loaded.length > 0) {
      onAddFiles(loaded);
      setIsOpen(true);
    }
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPath.trim() || !manualContent.trim()) return;

    onAddFiles([
      {
        path: manualPath.trim(),
        name: manualPath.split('/').pop() || manualPath,
        content: manualContent,
        size: manualContent.length,
        language: getLanguage(manualPath),
      },
    ]);

    setManualPath('');
    setManualContent('');
    setShowManualForm(false);
  };

  const getLanguage = (fileName: string): string => {
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return 'typescript';
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return 'javascript';
    if (fileName.endsWith('.json')) return 'json';
    if (fileName.endsWith('.sql')) return 'sql';
    if (fileName.endsWith('.py')) return 'python';
    if (fileName.endsWith('.go')) return 'go';
    if (fileName.endsWith('.rs')) return 'rust';
    return 'plaintext';
  };

  const totalBytes = projectFiles.reduce((acc, f) => acc + f.size, 0);
  const approxTokens = Math.round(totalBytes / 4);

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden text-xs">
      {/* Hidden Inputs */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderUpload}
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFilesUpload}
        multiple
        accept=".ts,.tsx,.js,.jsx,.json,.sql,.py,.go,.rs,.md"
        className="hidden"
      />

      {/* Bar Header */}
      <div className="px-3.5 py-2 flex flex-wrap items-center justify-between gap-2.5">
        <div 
          className="flex items-center gap-2 cursor-pointer select-none flex-1 min-w-[200px]"
          onClick={() => setIsOpen(!isOpen)}
        >
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-zinc-200">
            Codebase Context ({projectFiles.length} files)
          </span>
          {projectFiles.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300">
              ~{approxTokens.toLocaleString()} tokens
            </span>
          )}
          <span className="text-[11px] text-zinc-500 hidden sm:inline ml-1">
            {projectFiles.length > 0 ? 'Models inspect your real code directly' : 'Load project folder or files'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/60 transition cursor-pointer"
            title="Upload local project folder (Chrome/Edge/Firefox)"
          >
            <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Select Folder</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs border border-zinc-700/60 transition cursor-pointer"
            title="Select specific files"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden md:inline">Add Files</span>
          </button>

          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs border border-zinc-700/60 transition cursor-pointer"
            title="Paste custom code snippet"
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Paste Code</span>
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-zinc-500 hover:text-zinc-200 p-1"
          >
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-3 border-t border-zinc-800/80 space-y-2.5 bg-zinc-950/40">
          
          {/* Manual Input Form */}
          {showManualForm && (
            <form onSubmit={handleAddManual} className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-300 text-xs">Add File Path & Code:</span>
                <button type="button" onClick={() => setShowManualForm(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={manualPath}
                onChange={(e) => setManualPath(e.target.value)}
                placeholder="Relative path: e.g. src/services/auth.ts or schema.sql"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-zinc-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                required
              />
              <textarea
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                placeholder="Paste code contents here..."
                rows={4}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-3 py-1 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs"
                >
                  Save File
                </button>
              </div>
            </form>
          )}

          {/* Files List */}
          {projectFiles.length === 0 ? (
            <div className="text-center py-4 text-zinc-500 border border-dashed border-zinc-850 rounded-lg">
              <UploadCloud className="w-6 h-6 mx-auto mb-1 text-zinc-600" />
              <span>No codebase files loaded yet. Click &quot;Select Folder&quot; above to inspect your repo.</span>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5 text-[11px] text-zinc-400">
                <span>Loaded Project Files:</span>
                <button
                  onClick={onClearFiles}
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {projectFiles.map((file) => (
                  <div
                    key={file.path}
                    className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-1.5 hover:border-zinc-700 transition"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileCode className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                      <span className="font-mono text-[11px] text-zinc-200 truncate" title={file.path}>
                        {file.path}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setSelectedFile(file)}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                        title="View file content"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onRemoveFile(file.path)}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-rose-400"
                        title="Remove file"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Code Viewer Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-3xl w-full p-4 shadow-xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs font-bold text-zinc-200">{selectedFile.path}</span>
              </div>
              <button onClick={() => setSelectedFile(null)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-zinc-950 p-3 rounded-lg border border-zinc-800">
              <pre className="text-cyan-300 font-mono text-xs leading-relaxed whitespace-pre">
                {selectedFile.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
