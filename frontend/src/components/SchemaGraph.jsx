import React, { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position
} from '@xyflow/react';
import { Layers, Key, Link2 } from 'lucide-react';
import '@xyflow/react/dist/style.css';

// Custom Node component representing a database table
const TableNode = ({ data }) => {
  return (
    <div className="bg-dark-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[200px] max-w-[260px] text-slate-100 font-sans">
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-2.5 h-2.5 !bg-brand-500 !border-dark-900" 
      />
      
      {/* Table Name Header */}
      <div className="bg-brand-500/10 border-b border-white/5 px-3 py-2 flex items-center gap-2">
        <Layers className="w-3.5 h-3.5 text-brand-400 shrink-0" />
        <span className="font-mono text-xs font-bold text-brand-400 truncate tracking-wide">{data.label}</span>
      </div>
      
      {/* Columns list */}
      <div className="p-2 space-y-1 bg-dark-950/40">
        {data.columns.map((col, idx) => (
          <div key={idx} className="flex items-center justify-between text-[10px] px-1.5 py-0.5 rounded hover:bg-white/5">
            <span className="font-mono text-slate-300 truncate flex items-center gap-1.5">
              {col.primaryKey && <Key className="w-2.5 h-2.5 text-amber-500 shrink-0" />}
              {col.foreignKey && <Link2 className="w-2.5 h-2.5 text-brand-400 shrink-0" />}
              <span className={col.primaryKey ? 'text-amber-400 font-semibold' : ''}>{col.name}</span>
            </span>
            <span className="font-mono text-slate-500 text-[8px] ml-2 shrink-0">{col.type}</span>
          </div>
        ))}
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-2.5 h-2.5 !bg-brand-500 !border-dark-900" 
      />
    </div>
  );
};

// Register custom node types
const nodeTypes = {
  tableNode: TableNode
};

export default function SchemaGraph({ schema }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // spacing parameters for grid layout
  const cols = 3;
  const spacingX = 290;
  const spacingY = 240;

  useEffect(() => {
    if (!schema || Object.keys(schema).length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // 1. Transform tables map into React Flow nodes using grid layout
    const nextNodes = Object.keys(schema).map((tableName, index) => {
      const table = schema[tableName];
      
      const x = (index % cols) * spacingX;
      const y = Math.floor(index / cols) * spacingY;
      
      const columnsWithFk = table.columns.map(col => {
        const isFk = table.foreignKeys.some(fk => fk.columnName === col.name);
        return {
          ...col,
          foreignKey: isFk
        };
      });

      return {
        id: tableName,
        type: 'tableNode',
        position: { x, y },
        data: { 
          label: tableName,
          columns: columnsWithFk
        }
      };
    });

    // 2. Transform foreign key constraints into connecting edges
    const nextEdges = [];
    Object.keys(schema).forEach((tableName) => {
      const table = schema[tableName];
      (table.foreignKeys || []).forEach((fk) => {
        nextEdges.push({
          id: `${tableName}-${fk.columnName}-${fk.referencedTable}`,
          source: fk.referencedTable, // referenced primary table (source)
          target: tableName,          // referencing child table (target)
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 1.5 },
          label: `${fk.columnName} ➔ ${fk.referencedColumn}`,
          labelStyle: { fill: '#94a3b8', fontSize: 7, fontFamily: 'monospace' },
          labelBgPadding: [3, 2],
          labelBgBorderRadius: 4,
          labelBgStyle: { fill: '#0b0f19', fillOpacity: 0.8 }
        });
      });
    });

    setNodes(nextNodes);
    setEdges(nextEdges);
  }, [schema]);

  return (
    <div className="w-full h-full bg-dark-950 font-sans" style={{ outline: 'none' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant="dots" 
          gap={16} 
          size={1} 
          color="rgba(255, 255, 255, 0.05)" 
        />
        <Controls 
          className="!bg-dark-900 !border-white/10 !rounded-lg overflow-hidden !shadow-lg [&>button]:!bg-dark-900 [&>button]:!border-white/5 [&>button]:!text-slate-400 [&>button:hover]:!bg-dark-800 [&>button:hover]:!text-slate-200" 
        />
      </ReactFlow>
    </div>
  );
}
