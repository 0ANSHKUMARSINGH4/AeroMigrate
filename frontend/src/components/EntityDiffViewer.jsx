import React from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';

export default function EntityDiffViewer({ oldCode, newCode, className }) {
  const customStyles = {
    variables: {
      dark: {
        diffViewerBackground: '#030712', // Match bg-dark-950
        addedBackground: 'rgba(16, 185, 129, 0.1)', // Subtle green
        addedGutterBackground: 'rgba(16, 185, 129, 0.15)',
        removedBackground: 'rgba(244, 63, 94, 0.1)', // Subtle rose
        removedGutterBackground: 'rgba(244, 63, 94, 0.15)',
        wordAddedBackground: 'rgba(16, 185, 129, 0.25)',
        wordRemovedBackground: 'rgba(244, 63, 94, 0.25)',
        gutterColor: '#4b5563', // Slate-600
        gutterBackground: '#0b0f19', // Match bg-dark-900
        emptyLineBackground: '#030712',
      }
    },
    line: {
      fontSize: '11px',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      lineHeight: '1.6',
    },
    gutter: {
      padding: '0 8px',
      minWidth: '35px',
      textAlign: 'right',
      borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      userSelect: 'none',
    }
  };

  return (
    <div className="w-full h-full overflow-auto bg-dark-950 rounded-b-xl border-t border-white/5">
      {oldCode === newCode ? (
        <div className="p-8 text-center text-xs text-slate-500 italic">
          No modifications in {className}.java
        </div>
      ) : (
        <ReactDiffViewer
          oldValue={oldCode || '// Class did not exist'}
          newValue={newCode || '// Class removed'}
          splitView={true}
          useDarkTheme={true}
          styles={customStyles}
          leftTitle="Previous Version"
          rightTitle="New Version"
        />
      )}
    </div>
  );
}
