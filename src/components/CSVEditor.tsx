import React, { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { 
  FileUp, 
  Plus, 
  Trash2, 
  Download, 
  X, 
  Grid3X3, 
  Clipboard, 
  Undo2,
  ChevronUp,
  ChevronDown,
  Settings2,
  Table as TableIcon,
  Maximize2,
  Eye,
  Check,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CSVData, SortConfig } from '../types';
import { cn, downloadCSV } from '../lib/utils';

interface ViewModalState {
  header: string;
  value: string;
}

export default function CSVEditor() {
  const [data, setData] = useState<CSVData | null>(null);
  const [isPasting, setIsPasting] = useState(false);
  const [pasteValue, setPasteValue] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [viewingCell, setViewingCell] = useState<ViewModalState | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyValue = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const rows = results.data as string[][];
        // Ensure all rows have equal length
        const maxCols = Math.max(...rows.map(r => r.length));
        const normalizedRows = rows.map(r => {
          const newRow = [...r];
          while (newRow.length < maxCols) newRow.push('');
          return newRow;
        });

        if (normalizedRows.length > 0) {
          setData({
            headers: normalizedRows[0],
            rows: normalizedRows.slice(1)
          });
        }
      },
      skipEmptyLines: true
    });
  };

  const handlePaste = () => {
    Papa.parse(pasteValue, {
      complete: (results) => {
        const rows = results.data as string[][];
        if (rows.length > 0) {
          const maxCols = Math.max(...rows.map(r => r.length));
          const normalizedRows = rows.map(r => {
            const newRow = [...r];
            while (newRow.length < maxCols) newRow.push('');
            return newRow;
          });
          setData({
            headers: normalizedRows[0],
            rows: normalizedRows.slice(1)
          });
          setIsPasting(false);
          setPasteValue('');
        }
      },
      skipEmptyLines: true
    });
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string, isHeader: boolean = false) => {
    if (!data) return;
    
    if (isHeader) {
      const newHeaders = [...data.headers];
      newHeaders[colIndex] = value;
      setData({ ...data, headers: newHeaders });
    } else {
      const newRows = [...data.rows];
      newRows[rowIndex] = [...newRows[rowIndex]];
      newRows[rowIndex][colIndex] = value;
      setData({ ...data, rows: newRows });
    }
  };

  const addRow = () => {
    if (!data) return;
    const newRow = Array(data.headers.length).fill('');
    setData({ ...data, rows: [...data.rows, newRow] });
  };

  const addColumn = () => {
    if (!data) return;
    setData({
      headers: [...data.headers, `Column ${data.headers.length + 1}`],
      rows: data.rows.map(row => [...row, ''])
    });
  };

  const deleteRow = (index: number) => {
    if (!data) return;
    const newRows = data.rows.filter((_, i) => i !== index);
    setData({ ...data, rows: newRows });
  };

  const deleteColumn = (index: number) => {
    if (!data || data.headers.length <= 1) return;
    setData({
      headers: data.headers.filter((_, i) => i !== index),
      rows: data.rows.map(row => row.filter((_, i) => i !== index))
    });
  };

  const clearData = () => {
    if (window.confirm('Are you sure you want to clear all data?')) {
      setData(null);
      setSortConfig(null);
    }
  };

  const exportCSV = () => {
    if (!data) return;
    const csv = Papa.unparse([data.headers, ...data.rows]);
    downloadCSV('edited_data.csv', csv);
  };

  const handleSort = (colIndex: number) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === colIndex && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key: colIndex, direction });

    const sortedRows = [...data!.rows].sort((a, b) => {
      const valA = a[colIndex];
      const valB = b[colIndex];
      
      // Try numeric sort first
      const numA = parseFloat(valA);
      const numB = parseFloat(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return direction === 'ascending' ? numA - numB : numB - numA;
      }
      
      if (valA < valB) return direction === 'ascending' ? -1 : 1;
      if (valA > valB) return direction === 'ascending' ? 1 : -1;
      return 0;
    });

    setData({ ...data!, rows: sortedRows });
  };

  if (!data && !isPasting) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl w-full"
        >
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 text-center border-b border-gray-50">
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TableIcon className="w-8 h-8 text-teal-600" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2 tracking-tight">CSV Flow</h1>
              <p className="text-gray-500">Simplify your data management. Professional CSV viewing and editing in your browser.</p>
            </div>
            
            <div className="p-8 space-y-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-between p-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl hover:border-teal-500 hover:bg-teal-50/10 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                    <FileUp className="w-5 h-5 text-gray-400 group-hover:text-teal-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Upload File</div>
                    <div className="text-sm text-gray-500">XLSX, CSV supported</div>
                  </div>
                </div>
                <ChevronUp className="w-5 h-5 text-gray-300 rotate-90" />
              </button>

              <button
                onClick={() => setIsPasting(true)}
                className="w-full flex items-center justify-between p-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl hover:border-orange-500 hover:bg-orange-50/10 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                    <Clipboard className="w-5 h-5 text-gray-400 group-hover:text-orange-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Paste Text</div>
                    <div className="text-sm text-gray-500">Copy data from your source</div>
                  </div>
                </div>
                <ChevronUp className="w-5 h-5 text-gray-300 rotate-90" />
              </button>

              <div className="pt-4 flex items-center gap-2 text-xs text-gray-400 justify-center">
                <Settings2 className="w-3 h-3" />
                <span>Auto-detects delimiters and headers</span>
              </div>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".csv" 
            className="hidden" 
          />
        </motion.div>
      </div>
    );
  }

  if (isPasting) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px]"
        >
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Paste CSV Content</h2>
            <button onClick={() => setIsPasting(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 p-6">
            <textarea
              className="w-full h-full p-4 bg-gray-50 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-mono text-sm"
              placeholder="Paste your CSV data here..."
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
            />
          </div>
          <div className="p-6 border-t border-gray-50 bg-gray-50/50 flex justify-end gap-3">
            <button 
              onClick={() => setIsPasting(false)}
              className="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handlePaste}
              className="px-6 py-2.5 rounded-xl font-medium bg-orange-600 text-white hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50"
              disabled={!pasteValue.trim()}
            >
              Process Data
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col">
      {/* Detail Modal Overlay */}
      <AnimatePresence>
        {viewingCell && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingCell(null)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Maximize2 className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Column</div>
                    <div className="font-semibold text-gray-900">{viewingCell.header}</div>
                  </div>
                </div>
                <button onClick={() => setViewingCell(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="p-8">
                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words min-h-[100px] max-h-[400px] overflow-auto">
                  {viewingCell.value || <span className="text-gray-300 italic">Empty cell</span>}
                </div>
              </div>
              <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  onClick={() => handleCopyValue(viewingCell.value)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm border",
                    copied 
                      ? "bg-green-50 border-green-200 text-green-600" 
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy Value
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setViewingCell(null)}
                  className="px-6 py-2 bg-slate-900 border border-slate-900 rounded-xl text-sm font-semibold text-white hover:bg-slate-800 transition-all shadow-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header / Toolbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 z-30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
            <TableIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-gray-900 tracking-tight text-lg">CSV Flow</span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={addRow}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Row
          </button>
          <button 
            onClick={addColumn}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border-r border-gray-200 mr-2 pr-4"
          >
            <Plus className="w-4 h-4" /> Add Col
          </button>
          
          <button 
            onClick={clearData}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear Data"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-1.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-all shadow-sm active:scale-95 ml-2"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </header>

      {/* Main Content (Scrollable Area) */}
      <main className="flex-1 pt-16 pb-12 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto p-6 scroll-smooth">
          <div className="inline-block min-w-full align-middle">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden ring-1 ring-black/5">
              <table className="min-w-full divide-y divide-gray-200 border-collapse table-fixed">
                <thead className="bg-[#F8FAFC] sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                  <tr>
                    <th className="w-12 px-2 py-4 bg-gray-100/80 border-r border-gray-200 backdrop-blur-sm"></th>
                    {data?.headers.map((header, i) => (
                      <th 
                        key={i} 
                        className="group relative px-4 py-4 text-left border-r border-gray-200 last:border-r-0 min-w-[180px] bg-slate-50/90 transition-colors hover:bg-slate-100"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <input
                            type="text"
                            value={header}
                            onChange={(e) => updateCell(0, i, e.target.value, true)}
                            className="bg-transparent font-bold text-slate-700 uppercase tracking-wider text-[11px] focus:outline-none focus:ring-2 focus:ring-teal-500/30 rounded-md px-2 py-1 w-full transition-all"
                          />
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleSort(i)}
                              className={cn(
                                "p-1.5 hover:bg-white rounded-md transition-all shadow-sm border border-transparent hover:border-gray-200",
                                sortConfig?.key === i ? "text-teal-600 border-teal-200 bg-white" : "opacity-0 group-hover:opacity-100 text-gray-400"
                              )}
                              title="Sort"
                            >
                              {sortConfig?.key === i ? (
                                sortConfig.direction === 'ascending' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-4 h-4" />
                              ) : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => deleteColumn(i)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-600 rounded-md transition-all text-gray-400 border border-transparent hover:border-red-100"
                              title="Delete Column"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                    <th className="w-12 bg-gray-50 border-l border-gray-200"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {data?.rows.map((row, rowIndex) => (
                    <motion.tr 
                      key={rowIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15, delay: rowIndex * 0.01 }}
                      className="group/row hover:bg-teal-50/30 transition-colors"
                    >
                      <td className="w-12 px-2 py-2 text-center text-[10px] font-mono text-gray-400 border-r border-gray-100 bg-gray-50/40">
                        {(rowIndex + 1).toString().padStart(2, '0')}
                      </td>
                      {row.map((cell, colIndex) => (
                        <td key={colIndex} className="relative group px-4 py-0 border-r border-gray-100 last:border-r-0 h-11 transition-all focus-within:bg-white focus-within:z-10 focus-within:shadow-[inset_0_0_0_2px_#0d9488]">
                          <div className="flex items-center gap-1 h-full">
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                              className="w-full h-full bg-transparent text-sm text-gray-600 focus:outline-none rounded transition-all truncate pr-8"
                            />
                            <button 
                              onClick={() => setViewingCell({ header: data!.headers[colIndex], value: cell })}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur rounded-md text-teal-600 hover:bg-teal-600 hover:text-white transition-all shadow-sm border border-teal-100 ring-4 ring-transparent hover:ring-teal-50"
                              title="View detail"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      ))}
                      <td className="w-12 px-2 py-2 text-center border-l border-gray-100">
                        <button 
                          onClick={() => deleteRow(rowIndex)}
                          className="opacity-0 group-hover/row:opacity-100 p-1.5 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <footer className="h-10 bg-white border-t border-gray-200 px-6 flex items-center justify-between text-[11px] text-gray-400 font-bold tracking-widest uppercase">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-gray-300">TOTAL</span>
              <span className="text-teal-600 font-mono text-xs">{data?.rows.length} ROWS</span>
            </div>
            <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
            <div className="flex items-center gap-2">
              <span className="text-gray-300">STRUCTURE</span>
              <span className="text-teal-600 font-mono text-xs">{data?.headers.length} COLS</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>Ready for export</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
