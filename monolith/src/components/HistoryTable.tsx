import React, { useState } from 'react';
import { MoreHorizontal, Search, Download, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MotionIcon } from './MotionIcon';
import { cn } from '@/src/lib/utils';

interface HistoryTableProps {
  data: any[];
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  const filteredData = data.filter((item) => {
    const searchString = `${item.analysis?.topic || ''} ${item.analysis?.summary || ''} ${item.filename || ''}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <motion.div 
        className="flex flex-col md:flex-row gap-4 items-end justify-between bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10"
      >
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <label className="text-[0.6rem] uppercase tracking-widest text-on-surface-variant/90 font-bold">Search History</label>
          <div className="relative group">
            <MotionIcon className="absolute left-3 top-1/2 -translate-y-1/2"><Search size={14} className="text-on-surface-variant/70 group-focus-within:text-primary transition-colors" /></MotionIcon>
            <input 
              type="text" 
              placeholder="Topic or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-surface-container-low border border-outline-variant/10 rounded-sm pl-9 pr-4 py-2 text-sm text-primary placeholder:text-on-surface-variant/20 focus:outline-none focus:border-primary/40 w-full lg:w-96 transition-all"
            />
          </div>
        </div>
      </motion.div>

      <div className="relative overflow-hidden bg-surface-container-low rounded-xl border border-outline-variant/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container-lowest/50">
                <th className="px-6 py-6 text-[0.6875rem] uppercase tracking-[0.1em] text-on-surface-variant/90 font-semibold">Source</th>
                <th className="px-6 py-6 text-[0.6875rem] uppercase tracking-[0.1em] text-on-surface-variant/90 font-semibold">Topic</th>
                <th className="px-6 py-6 text-[0.6875rem] uppercase tracking-[0.1em] text-on-surface-variant/90 font-semibold text-center">Urgency</th>
                <th className="px-6 py-6 text-[0.6875rem] uppercase tracking-[0.1em] text-on-surface-variant/90 font-semibold">Summary</th>
                <th className="px-6 py-6 text-[0.6875rem] uppercase tracking-[0.1em] text-on-surface-variant/90 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => {
                  const urgency = item.analysis?.urgency_score || 0;
                  return (
                    <motion.tr 
                      key={index} 
                      className="group transition-all duration-300 border-b border-outline-variant/5 hover:bg-white/[0.03]"
                    >
                      <td className="px-6 py-4 max-w-[150px] truncate">
                        <span className="font-mono text-[0.7rem] text-primary">{item.filename || 'upload.csv'}</span>
                        <br />
                        <span className="text-[0.65rem] text-white/40">{item.rows || 0} rows</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[0.65rem] font-bold uppercase tracking-widest rounded-full">
                          {item.analysis?.topic || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className={cn("text-xs font-black", urgency > 7 ? 'text-red-400' : 'text-green-400')}>{urgency}/10</span>
                          <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className={cn("h-full", urgency > 7 ? 'bg-red-400' : 'bg-green-400')} style={{ width: `${urgency * 10}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <p className="text-[0.75rem] text-white/80 line-clamp-2">{item.analysis?.summary || 'No summary available.'}</p>
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button 
                          onClick={() => setOpenMenuIndex(openMenuIndex === index ? null : index)}
                          className="text-white/50 hover:text-white p-2"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        <AnimatePresence>
                          {openMenuIndex === index && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-10 top-full -mt-4 w-64 bg-surface-container border border-outline-variant/20 shadow-2xl rounded-lg overflow-hidden z-50 p-4 text-left"
                            >
                              <p className="text-[0.65rem] uppercase text-white/50 font-bold mb-2">Auto-Reply Draft:</p>
                              <p className="text-[0.7rem] italic text-white/90 mb-4 bg-white/5 p-2 rounded">
                                "{item.analysis?.auto_reply}"
                              </p>
                              <p className="text-[0.65rem] uppercase text-white/50 font-bold mb-2">Issues:</p>
                              <ul className="list-disc pl-4 text-[0.7rem] text-red-300">
                                {item.analysis?.issues?.map((iss: string, i: number) => <li key={i}>{iss}</li>)}
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-white/40 text-[0.75rem] uppercase tracking-widest">
                    No data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
