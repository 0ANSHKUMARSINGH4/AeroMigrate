import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  Terminal, 
  Coffee, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Copy, 
  Check, 
  FileCode,
  ShieldAlert,
  ArrowRightLeft,
  History,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import SchemaGraph from './components/SchemaGraph';
import EntityDiffViewer from './components/EntityDiffViewer';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081';

export default function App() {
  const [command, setCommand] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'history'
  
  // Chat & timeline state
  const [chats, setChats] = useState([
    {
      id: 'welcome',
      role: 'agent',
      message: 'Welcome! I am your autonomous database migration agent. Type a migration request (e.g., "Create a users table with id, name, and email columns"). I will generate a migration proposal, flag destructive operations, and wait for your approval before execution.',
      timestamp: new Date().toLocaleTimeString(),
      success: true
    }
  ]);
  const [currentTimeline, setCurrentTimeline] = useState([]);
  const [activeStep, setActiveStep] = useState(-1);

  // Enterprise Safety Gate state
  const [proposedMigration, setProposedMigration] = useState(null);
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);

  // Migration History state
  const [migrationHistory, setMigrationHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Database schema state
  const [schema, setSchema] = useState({});
  const [schemaLoading, setSchemaLoading] = useState(false);

  // ORM Entity code state
  const [entities, setEntities] = useState([]);
  const [previousEntities, setPreviousEntities] = useState([]);
  const [viewMode, setViewMode] = useState('code'); // 'code' or 'diff'
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [copiedEntity, setCopiedEntity] = useState(false);
  const [executedSql, setExecutedSql] = useState('');

  const chatEndRef = useRef(null);

  // Fetch initial schema and history on mount
  useEffect(() => {
    fetchSchema();
    fetchHistory();
  }, []);

  // Scroll to bottom when chat updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, currentTimeline, isMigrating, proposedMigration]);

  const fetchSchema = async () => {
    setSchemaLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/schema`);
      if (response.ok) {
        const data = await response.json();
        setSchema(data);
      }
    } catch (err) {
      console.error('Error fetching schema:', err);
    } finally {
      setSchemaLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/history`);
      if (response.ok) {
        const data = await response.json();
        setMigrationHistory(data);
      }
    } catch (err) {
      console.error('Error fetching migration history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedEntity(true);
    setTimeout(() => setCopiedEntity(false), 2000);
  };

  // Step 1: Submit migration request to generate proposal DDL (doesn't execute)
  const handleMigrationSubmit = async (e) => {
    e.preventDefault();
    if (!command.trim() || isMigrating || proposedMigration) return;

    const userMsg = command.trim();
    setCommand('');
    setIsMigrating(true);
    setSafetyAcknowledged(false);

    // Add user message to chat history
    setChats(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      message: userMsg,
      timestamp: new Date().toLocaleTimeString()
    }]);

    setCurrentTimeline([
      { text: '🔍 Inspecting current database schema...', status: 'loading' },
      { text: '🤖 Invoking AI Agent to generate up/down SQL DDL proposal...', status: 'pending' },
      { text: '📋 Generating structured DDL schema response...', status: 'pending' }
    ]);
    setActiveStep(0);

    // Timeline simulation
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step === 1) {
        setCurrentTimeline(prev => {
          const next = [...prev];
          next[0].status = 'success';
          next[1].status = 'loading';
          return next;
        });
        setActiveStep(1);
      } else if (step === 2) {
        setCurrentTimeline(prev => {
          const next = [...prev];
          next[1].status = 'success';
          next[2].status = 'loading';
          return next;
        });
        setActiveStep(2);
      } else {
        clearInterval(interval);
      }
    }, 1500);

    try {
      const response = await fetch(`${BACKEND_URL}/api/migrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: userMsg })
      });

      clearInterval(interval);
      const result = await response.json();

      if (response.ok && result.success) {
        const backendTimeline = result.timeline.map((t) => {
          let status = 'success';
          if (t.includes('WARNING') || t.includes('destructive') || t.includes('destructive')) {
            status = 'warning';
          }
          return { text: t, status };
        });

        setCurrentTimeline(backendTimeline);
        setActiveStep(backendTimeline.length);
        setProposedMigration(result.proposal);

        setChats(prev => [...prev, {
          id: Date.now().toString(),
          role: 'agent',
          message: `I have generated a migration proposal: "${result.proposal.description}". Please review the Up/Down SQL commands and approve execution.`,
          timestamp: new Date().toLocaleTimeString(),
          success: true
        }]);
      } else {
        const backendTimeline = (result.timeline || []).map(t => ({ text: t, status: 'error' }));
        if (backendTimeline.length === 0) {
          backendTimeline.push({ text: result.errorMessage || 'AI generation failed.', status: 'error' });
        }
        setCurrentTimeline(backendTimeline);
        setActiveStep(backendTimeline.length);

        setChats(prev => [...prev, {
          id: Date.now().toString(),
          role: 'agent',
          message: `Proposal generation failed: ${result.errorMessage || 'Failed to generate schema proposal.'}`,
          timestamp: new Date().toLocaleTimeString(),
          success: false
        }]);
      }
    } catch (err) {
      clearInterval(interval);
      console.error(err);
      setCurrentTimeline(prev => prev.map(t => t.status === 'loading' ? { ...t, status: 'error' } : t));
      setChats(prev => [...prev, {
        id: Date.now().toString(),
        role: 'agent',
        message: 'Could not connect to the backend server. Please verify the Spring Boot service is running.',
        timestamp: new Date().toLocaleTimeString(),
        success: false
      }]);
    } finally {
      setIsMigrating(false);
    }
  };

  // Reject the proposed migration
  const handleReject = () => {
    setProposedMigration(null);
    setSafetyAcknowledged(false);
    setCurrentTimeline(prev => [...prev, { text: '❌ Migration proposal rejected by human-in-the-loop.', status: 'error' }]);
    
    setChats(prev => [...prev, {
      id: Date.now().toString(),
      role: 'agent',
      message: 'Migration proposal rejected. You can enter another request.',
      timestamp: new Date().toLocaleTimeString(),
      success: false
    }]);
  };

  // Step 2: Execute approved migration script
  const handleApproveAndExecute = async () => {
    if (!proposedMigration || isMigrating) return;
    if (proposedMigration.destructive && !safetyAcknowledged) return;

    setIsMigrating(true);
    const proposal = proposedMigration;
    setProposedMigration(null); // Clear proposal layout

    // Cache the current entities into previousEntities for diff viewing
    setPreviousEntities([...entities]);

    setCurrentTimeline(prev => [
      ...prev,
      { text: '⚡ Executing approved SQL DDL statements...', status: 'loading' },
      { text: '📝 Writing migration execution to history table...', status: 'pending' },
      { text: '☕ Generating updated Java ORM classes...', status: 'pending' }
    ]);

    try {
      const response = await fetch(`${BACKEND_URL}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upScript: proposal.upScript,
          downScript: proposal.downScript,
          description: proposal.description
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const backendTimeline = result.timeline.map(t => ({ text: t, status: 'success' }));
        setCurrentTimeline(prev => {
          const base = prev.filter(t => !t.text.includes('Executing') && !t.text.includes('history') && !t.text.includes('Java ORM'));
          return [...base, ...backendTimeline];
        });

        // Update database and code states
        setSchema(result.newSchema);

        if (result.javaEntities && result.javaEntities.length > 0) {
          setEntities(result.javaEntities);
          setSelectedEntity(result.javaEntities[0].className);
        }
        if (result.executedSql) {
          setExecutedSql(result.executedSql);
        }

        setChats(prev => [...prev, {
          id: Date.now().toString(),
          role: 'agent',
          message: `Migration successfully applied! I executed the schema DDL, updated the version history database, and regenerated the JPA Entities.`,
          timestamp: new Date().toLocaleTimeString(),
          success: true
        }]);

        // Auto select 'diff' mode if changes were made
        if (entities.length > 0) {
          setViewMode('diff');
        }

        // Refresh database history
        fetchHistory();
      } else {
        setCurrentTimeline(prev => [...prev.map(t => t.status === 'loading' ? { ...t, status: 'error' } : t)]);
        setChats(prev => [...prev, {
          id: Date.now().toString(),
          role: 'agent',
          message: `Execution failed: ${result.errorMessage || 'Failed to apply migration SQL.'}`,
          timestamp: new Date().toLocaleTimeString(),
          success: false
        }]);
      }
    } catch (err) {
      console.error(err);
      setChats(prev => [...prev, {
        id: Date.now().toString(),
        role: 'agent',
        message: 'Could not connect to the backend server during execution.',
        timestamp: new Date().toLocaleTimeString(),
        success: false
      }]);
    } finally {
      setIsMigrating(false);
    }
  };

  // Rollback a specific migration version
  const handleRollback = async (historyId, description) => {
    if (isMigrating) return;
    
    setIsMigrating(true);
    setActiveTab('chat'); // Switch tab to show timeline
    setPreviousEntities([...entities]); // Cache entities for diffing

    setCurrentTimeline([
      { text: `🔄 Requesting rollback for migration: "${description}"...`, status: 'loading' },
      { text: '⚡ Running rollback Down DDL script...', status: 'pending' },
      { text: '☕ Regenerating Java Entity classes for rolled back schema...', status: 'pending' }
    ]);

    try {
      const response = await fetch(`${BACKEND_URL}/api/rollback/${historyId}`, {
        method: 'POST'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const backendTimeline = result.timeline.map(t => ({ text: t, status: 'success' }));
        setCurrentTimeline(backendTimeline);
        
        // Update database and entities state
        setSchema(result.newSchema);

        setEntities(result.javaEntities);
        if (result.javaEntities.length > 0) {
          setSelectedEntity(result.javaEntities[0].className);
        } else {
          setSelectedEntity(null);
        }
        
        if (result.executedSql) {
          setExecutedSql(result.executedSql);
        }

        setChats(prev => [...prev, {
          id: Date.now().toString(),
          role: 'agent',
          message: `Rollback completed successfully! Database reverted using the Down script. History table state updated to ROLLED_BACK.`,
          timestamp: new Date().toLocaleTimeString(),
          success: true
        }]);

        if (result.javaEntities.length > 0) {
          setViewMode('diff');
        }

        // Refresh database history
        fetchHistory();
      } else {
        setCurrentTimeline(prev => [...prev.map(t => t.status === 'loading' ? { ...t, status: 'error' } : t)]);
        setChats(prev => [...prev, {
          id: Date.now().toString(),
          role: 'agent',
          message: `Rollback failed: ${result.errorMessage || 'Failed to execute rollback script.'}`,
          timestamp: new Date().toLocaleTimeString(),
          success: false
        }]);
      }
    } catch (err) {
      console.error(err);
      setChats(prev => [...prev, {
        id: Date.now().toString(),
        role: 'agent',
        message: 'Could not connect to the backend server during rollback.',
        timestamp: new Date().toLocaleTimeString(),
        success: false
      }]);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-slate-100 font-sans selection:bg-brand-500/30">
      
      {/* Header */}
      <header className="h-16 px-6 glass flex items-center justify-between border-b border-white/5 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-500 shadow-lg shadow-brand-500/10">
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-dark-950 rounded-full animate-ping"></span>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-dark-950 rounded-full"></span>
          </div>
          <div>
            <h1 className="font-semibold text-base tracking-tight flex items-center gap-2">
              AeroMigrate <span className="text-xs font-mono font-medium px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 border border-brand-500/20">v1.2.0</span>
            </h1>
            <p className="text-xs text-slate-400">Autonomous migrations with interactive ERD & side-by-side code diffs</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-white/5 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
            Connected: <span className="font-mono text-emerald-400">aeromigrate_sandbox:3306</span>
          </div>
          <button 
            onClick={() => {
              fetchSchema();
              fetchHistory();
            }}
            disabled={schemaLoading || isMigrating}
            className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 border border-white/5 text-slate-300 disabled:opacity-50 transition-colors"
            title="Refresh database schema and history"
          >
            <RefreshCw className={`w-4 h-4 ${schemaLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Workspace Split Screen */}
      <main className="flex-1 flex overflow-hidden">

        {/* Left Panel: Chat Timeline or History list */}
        <section className="w-full md:w-[480px] shrink-0 border-r border-white/5 flex flex-col bg-dark-900 overflow-hidden">
          
          {/* Navigation Tabs */}
          <div className="flex border-b border-white/5 bg-dark-900 shrink-0">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3.5 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'chat'
                  ? 'border-brand-500 text-brand-400 bg-brand-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Workspace Agent
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                fetchHistory();
              }}
              className={`flex-1 py-3.5 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'history'
                  ? 'border-brand-500 text-brand-400 bg-brand-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Version History
            </button>
          </div>

          {/* Panel Contents */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === 'chat' ? (
              // Tab 1: Chat timeline and Safety Gate Approval blocks
              <div className="space-y-6">
                
                {chats.map((chat) => (
                  <div 
                    key={chat.id} 
                    className={`flex gap-3 max-w-[85%] ${chat.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    {chat.role === 'agent' && (
                      <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 shrink-0">
                        <Terminal className="w-4 h-4" />
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                        chat.role === 'user' 
                          ? 'bg-brand-600 text-white rounded-tr-none' 
                          : 'bg-dark-800 border border-white/5 text-slate-200 rounded-tl-none shadow-md'
                      }`}>
                        {chat.message}
                      </div>
                      <span className="text-[10px] text-slate-500 px-1 block">{chat.timestamp}</span>
                    </div>
                  </div>
                ))}

                {/* Active Execution Timeline */}
                {(isMigrating || currentTimeline.length > 0) && (
                  <div className="p-4 rounded-xl bg-dark-950 border border-white/5 space-y-4 shadow-inner">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                        {isMigrating ? (
                          <Loader2 className="w-3.5 h-3.5 text-brand-500 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                        Agent Orchestrator Loop
                      </span>
                      <span className={`text-[10px] font-mono ${isMigrating ? 'text-brand-500 animate-pulse' : 'text-slate-500'}`}>
                        {isMigrating ? 'RUNNING' : 'PAUSED'}
                      </span>
                    </div>
                    
                    <div className="relative pl-5 space-y-3 border-l border-white/10 ml-2.5">
                      {currentTimeline.map((step, idx) => (
                        <div key={idx} className="relative">
                          <span className="absolute -left-[26px] top-0.5 flex items-center justify-center w-3 h-3 rounded-full bg-dark-950">
                            {step.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                            {step.status === 'loading' && <Loader2 className="w-3.5 h-3.5 text-brand-500 animate-spin" />}
                            {step.status === 'pending' && <span className="w-2 h-2 rounded-full bg-slate-700"></span>}
                            {step.status === 'warning' && <ShieldAlert className="w-3.5 h-3.5 text-amber-500 animate-bounce" />}
                            {step.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                          </span>
                          
                          <div className={`text-xs leading-snug ${step.status === 'error' ? 'text-rose-400 font-semibold' : 'text-slate-300'}`}>
                            {step.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Safety Gate - Migration Proposal Card */}
                {proposedMigration && (
                  <div className="p-4 rounded-xl bg-dark-950 border border-white/10 shadow-2xl space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <ArrowRightLeft className="w-4 h-4 text-brand-500" />
                      Migration DDL Proposal
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Change Summary</span>
                      <p className="text-xs text-slate-200 bg-white/5 p-2 rounded border border-white/5 italic">
                        "{proposedMigration.description}"
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] text-emerald-500 uppercase tracking-wider font-semibold">Up Script (Apply)</span>
                        <div className="bg-dark-900 border border-white/5 rounded-lg p-2.5 max-h-36 overflow-y-auto font-mono text-[10px] text-emerald-400 leading-normal mt-0.5">
                          <pre>{proposedMigration.upScript}</pre>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-[10px] text-rose-500 uppercase tracking-wider font-semibold">Down Script (Rollback)</span>
                        <div className="bg-dark-900 border border-white/5 rounded-lg p-2.5 max-h-24 overflow-y-auto font-mono text-[10px] text-rose-400 leading-normal mt-0.5">
                          <pre>{proposedMigration.downScript}</pre>
                        </div>
                      </div>
                    </div>

                    {/* Destructive Warning Panel */}
                    {proposedMigration.destructive ? (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-lg text-xs space-y-2.5">
                        <div className="flex items-center gap-1.5 font-bold">
                          <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                          CRITICAL DESTRUCTIVE CHANGE DETECTED
                        </div>
                        <p className="text-[10px] leading-relaxed text-rose-300">
                          This operation contains commands (such as <code>DROP</code> or <code>TRUNCATE</code>) which will result in permanent table deletion or data loss.
                        </p>
                        <label className="flex items-start gap-2 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={safetyAcknowledged}
                            onChange={(e) => setSafetyAcknowledged(e.target.checked)}
                            className="mt-0.5 rounded border-rose-500/40 text-rose-600 bg-dark-900 focus:ring-rose-500/50 cursor-pointer"
                          />
                          <span className="text-[10px] text-rose-200 font-semibold leading-tight">
                            I understand this operation is destructive and may cause permanent data loss.
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/15 text-emerald-400 rounded-lg text-[10px] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                        Safe Change: Safety checks indicate no table drop or data truncate.
                      </div>
                    )}

                    {/* Approve/Reject Buttons */}
                    <div className="flex gap-2.5 pt-1">
                      <button
                        onClick={handleReject}
                        className="flex-1 py-2 px-3 rounded-xl bg-dark-800 hover:bg-dark-700 text-xs font-semibold text-slate-300 border border-white/5 transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={handleApproveAndExecute}
                        disabled={proposedMigration.destructive && !safetyAcknowledged}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/10 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve & Execute
                      </button>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            ) : (
              // Tab 2: Database Version History List
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Tracked Migrations</span>
                  <span>{migrationHistory.length} total</span>
                </div>

                {historyLoading && migrationHistory.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-500 mb-2" />
                    <span className="text-xs">Loading execution history...</span>
                  </div>
                ) : migrationHistory.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 italic">
                    No history entries recorded yet. Apply a migration to list version history.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {migrationHistory.map((item, idx) => {
                      const isLatest = idx === 0;
                      const isApplied = item.status === 'APPLIED';
                      return (
                        <div 
                          key={item.id} 
                          className={`p-3.5 rounded-xl border bg-dark-950/40 relative space-y-3 shadow ${
                            isLatest && isApplied 
                              ? 'border-brand-500/30 shadow-brand-500/5' 
                              : 'border-white/5'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-[10px] font-mono text-slate-500">VERSION ID</div>
                              <div className="text-xs font-bold text-slate-200 font-mono mt-0.5">{item.version}</div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                              isApplied 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {item.status}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Description</span>
                            <div className="text-xs text-slate-300 leading-normal">{item.description}</div>
                          </div>

                          <div className="flex items-center justify-between border-t border-white/5 pt-2.5 text-[9px] text-slate-500">
                            <span>Applied: {new Date(item.appliedAt).toLocaleString()}</span>
                            
                            {/* Render Rollback Button only for the most recently applied migration */}
                            {isLatest && isApplied && (
                              <button
                                onClick={() => handleRollback(item.id, item.description)}
                                disabled={isMigrating}
                                className="px-2 py-1 rounded bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <RotateCcw className="w-2.5 h-2.5" />
                                Rollback
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Prompt Input Area - Disabled when proposal is pending */}
          <div className="p-4 bg-dark-950/50 border-t border-white/5">
            {proposedMigration && (
              <div className="text-xs text-slate-400 text-center py-2 italic flex items-center justify-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                Input locked. Approve or Reject the pending proposal.
              </div>
            )}
            <form onSubmit={handleMigrationSubmit} className={`flex gap-2 ${proposedMigration ? 'opacity-40 select-none pointer-events-none' : ''}`}>
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                disabled={isMigrating || !!proposedMigration}
                placeholder="e.g. Add phone_number to users table..."
                className="flex-1 bg-dark-800 border border-white/5 hover:border-white/10 focus:border-brand-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isMigrating || !command.trim() || !!proposedMigration}
                className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl px-4 py-3 flex items-center justify-center transition-colors shadow-lg shadow-brand-500/10 shrink-0 cursor-pointer"
              >
                {isMigrating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Right Panel: Split Screen (Schema Canvas & Entity Diffs) */}
        <section className="flex-1 flex flex-col overflow-hidden bg-dark-950">
          
          {/* Top Half: Interactive ERD Canvas */}
          <div className="flex-1 flex flex-col border-b border-white/5 overflow-hidden">
            <div className="h-10 px-4 border-b border-white/5 bg-dark-900/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Database className="w-3.5 h-3.5 text-brand-500" />
                Interactive Entity Relationship Diagram (ERD)
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {Object.keys(schema).length} TABLES DETECTED
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative bg-dark-950">
              {Object.keys(schema).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                  <Database className="w-8 h-8 opacity-30 mb-2 animate-bounce" />
                  <p className="text-xs italic">Submit a migration query to render the interactive ERD.</p>
                </div>
              ) : (
                <SchemaGraph schema={schema} />
              )}
            </div>
          </div>

          {/* Bottom Half: Generated ORM Code & Diff comparisons */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-10 px-4 border-b border-white/5 bg-dark-900/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Coffee className="w-3.5 h-3.5 text-amber-500" />
                Generated JPA Entities
              </div>
              
              <div className="flex items-center gap-3">
                {/* View Changes Mode Switch */}
                {entities.length > 0 && (
                  <div className="flex items-center bg-dark-800 rounded-lg p-0.5 border border-white/5 text-[10px] font-medium text-slate-400">
                    <button
                      onClick={() => setViewMode('code')}
                      className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                        viewMode === 'code'
                          ? 'bg-dark-950 text-slate-100 font-semibold shadow-inner'
                          : 'hover:text-slate-200'
                      }`}
                    >
                      View Code
                    </button>
                    <button
                      onClick={() => setViewMode('diff')}
                      className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                        viewMode === 'diff'
                          ? 'bg-dark-950 text-slate-100 font-semibold shadow-inner'
                          : 'hover:text-slate-200'
                      }`}
                    >
                      View Changes
                    </button>
                  </div>
                )}

                {/* Copy Button */}
                {entities.length > 0 && selectedEntity && viewMode === 'code' && (
                  <button
                    onClick={() => {
                      const activeCode = entities.find(e => e.className === selectedEntity)?.code;
                      if (activeCode) handleCopy(activeCode);
                    }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-dark-800 hover:bg-dark-700 text-[10px] text-slate-300 font-medium transition-colors border border-white/5 cursor-pointer"
                  >
                    {copiedEntity ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {entities.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 bg-dark-900/20">
                <FileCode className="w-8 h-8 opacity-30 mb-2" />
                <p className="text-xs italic">JPA entity classes will appear here after a successful migration.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* Entity File Tabs */}
                <div className="flex border-b border-white/5 bg-dark-900/60 shrink-0 overflow-x-auto">
                  {entities.map((ent) => (
                    <button
                      key={ent.className}
                      onClick={() => setSelectedEntity(ent.className)}
                      className={`px-4 py-2.5 text-xs font-medium border-r border-white/5 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                        selectedEntity === ent.className
                          ? 'bg-dark-950 text-amber-500 border-t-2 border-t-amber-500'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`}
                    >
                      <Coffee className="w-3 h-3" />
                      {ent.className}.java
                    </button>
                  ))}
                </div>

                {/* Diff Viewer vs Code Block Container */}
                <div className="flex-1 overflow-hidden relative">
                  {viewMode === 'diff' && selectedEntity ? (
                    // Renders Side-by-side diff comparing cached previous class vs new class
                    <EntityDiffViewer 
                      oldCode={previousEntities.find(e => e.className === selectedEntity)?.code} 
                      newCode={entities.find(e => e.className === selectedEntity)?.code} 
                      className={selectedEntity} 
                    />
                  ) : (
                    // Standard raw code viewer
                    <div className="w-full h-full overflow-auto bg-dark-950 p-4 font-mono text-xs leading-relaxed text-emerald-400/90 shadow-inner">
                      <pre className="whitespace-pre">
                        <code>
                          {entities.find((e) => e.className === selectedEntity)?.code || '// No Code Found'}
                        </code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* SQL Console Footer */}
      {executedSql && (
        <footer className="h-16 px-4 bg-dark-950 border-t border-white/5 flex items-center shrink-0">
          <div className="flex items-center gap-3 w-full">
            <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-slate-400">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 truncate">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Last Executed SQL</div>
              <div className="font-mono text-xs text-brand-400 truncate mt-0.5">{executedSql}</div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
