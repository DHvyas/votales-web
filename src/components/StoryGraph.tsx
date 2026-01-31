import { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactFlow, {
  type Node,
  type Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  useReactFlow,
} from 'reactflow';
import dagre from 'dagre';
import { Map as MapIcon, Maximize2, Minimize2 } from 'lucide-react';
import { useState } from 'react';
import 'reactflow/dist/style.css';
import type { StoryMapResponse } from '../services/api';
import StoryNode, { type StoryNodeData } from './StoryNode';

// Register custom node types
const nodeTypes = {
  storyNode: StoryNode,
};

// Edge type for processing
interface EdgeData {
  sourceId: string;
  targetId: string;
  votes: number;
}

interface StoryGraphProps {
  mapData?: StoryMapResponse | null;
  currentTaleId?: string;
  isLoading?: boolean;
  onNodeClick?: (nodeId: string) => void;
}

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  // Create a fresh graph for each layout
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 120 });

  nodes.forEach((node) => {
    // Use larger dimensions for pill-shaped custom nodes
    g.setNode(node.id, { width: 180, height: 50 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 90,
        y: nodeWithPosition.y - 25,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// Edge style generators
const getEdgeStyle = (isWinner: boolean): React.CSSProperties => {
  if (isWinner) {
    // Winner edge: Thick, Gold/Violet gradient
    return {
      stroke: '#8b5cf6',
      strokeWidth: 3,
    };
  }

  // Default edge: Thin, Gray
  return {
    stroke: '#334155',
    strokeWidth: 1,
  };
};

// Process edges to find the "Golden Path" (most voted edges from each node)
// Handles ties: ALL edges with maxVotes become winners
// Handles zero votes: If maxVotes === 0, no edges are winners
const processGoldenPath = (
  edges: EdgeData[]
): Map<string, string> => {
  // Group edges by source
  const edgesBySource = new Map<string, EdgeData[]>();
  
  edges.forEach((edge) => {
    const group = edgesBySource.get(edge.sourceId) || [];
    group.push(edge);
    edgesBySource.set(edge.sourceId, group);
  });

  // Find winner(s) for each source - supports ties
  const winners = new Map<string, string>();
  
  edgesBySource.forEach((sourceEdges: EdgeData[], sourceId: string) => {
    // Rule 1: Calculate maxVotes for this group
    const maxVotes = Math.max(...sourceEdges.map((e: EdgeData) => e.votes));
    
    // Rule 1 (Zero Vote Check): If maxVotes === 0, no edges are winners
    if (maxVotes === 0) {
      return; // Skip this group - no winners
    }
    
    // Rule 2 (Tie Check): Mark ALL edges with maxVotes as winners
    sourceEdges.forEach((edge: EdgeData) => {
      if (edge.votes === maxVotes) {
        winners.set(`${sourceId}-${edge.targetId}`, edge.targetId);
      }
    });
  });

  return winners;
};

// Helper component to center view on current node
function CenterOnCurrentNode({ 
  currentTaleId, 
  nodes 
}: { 
  currentTaleId?: string; 
  nodes: Node<StoryNodeData>[] 
}) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (!currentTaleId || nodes.length === 0) return;

    const currentNode = nodes.find(n => n.id === currentTaleId);
    if (currentNode) {
      // Small delay to ensure nodes are rendered
      const timer = setTimeout(() => {
        fitView({
          nodes: [{ id: currentTaleId }],
          padding: 2,
          duration: 500,
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentTaleId, nodes, fitView]);

  return null;
}

export default function StoryGraph({ mapData, currentTaleId, isLoading, onNodeClick }: StoryGraphProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle node click to navigate to that tale
  const handleNodeClick = (_event: React.MouseEvent, node: Node<StoryNodeData>) => {
    if (onNodeClick) {
      onNodeClick(node.id);
    }
  };

  const { processedNodes, processedEdges } = useMemo(() => {
    if (!mapData || !mapData.nodes || mapData.nodes.length === 0) {
      // Return empty arrays if no data
      return { processedNodes: [], processedEdges: [] };
    }

    // Calculate the golden path (winning edges)
    const goldenPath = processGoldenPath(mapData.edges);
    
    // Track which nodes are on the winner path
    const winnerNodes = new Set<string>();
    goldenPath.forEach((targetId, edgeKey) => {
      const sourceId = edgeKey.split('-')[0];
      winnerNodes.add(sourceId);
      winnerNodes.add(targetId);
    });

    // Create React Flow nodes with custom node type
    const nodes: Node<StoryNodeData>[] = mapData.nodes.map((node) => ({
      id: node.id,
      type: 'storyNode',
      data: {
        label: node.label || 'Untitled',
        nodeType: node.type,
        isCurrent: node.id === currentTaleId,
        isOnWinnerPath: winnerNodes.has(node.id),
        isDeleted: node.isDeleted ?? false,
      },
      position: { x: 0, y: 0 },
    }));

    // Create React Flow edges
    const edges: Edge[] = mapData.edges.map((edge) => {
      const edgeKey = `${edge.sourceId}-${edge.targetId}`;
      const isWinner = goldenPath.has(edgeKey);
      
      return {
        id: `e-${edge.sourceId}-${edge.targetId}`,
        source: edge.sourceId,
        target: edge.targetId,
        type: 'smoothstep',
        style: getEdgeStyle(isWinner),
        animated: isWinner,
        label: edge.votes > 0 ? `${edge.votes}` : undefined,
        labelStyle: { fill: '#94a3b8', fontSize: 10 },
        labelBgStyle: { fill: 'rgba(15, 23, 42, 0.8)' },
        labelBgPadding: [4, 2] as [number, number],
      };
    });

    return { processedNodes: nodes, processedEdges: edges };
  }, [mapData, currentTaleId]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (processedNodes.length === 0) {
      return { nodes: [], edges: [] };
    }
    return getLayoutedElements(processedNodes, processedEdges);
  }, [processedNodes, processedEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Update nodes and edges when layouted elements change
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative h-full flex items-center justify-center"
      >
        <div className="h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900/95 backdrop-blur-xl w-full">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex items-center gap-2 ml-4">
                <MapIcon className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-slate-300">Story Map</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <MapIcon className="w-8 h-8 text-violet-400 mx-auto mb-4" />
              </motion.div>
              <p className="text-slate-400 text-sm">Loading story map...</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Empty state
  if (!mapData || processedNodes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative h-full"
      >
        <div className="h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900/95 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex items-center gap-2 ml-4">
                <MapIcon className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-slate-300">Story Map</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-slate-500 text-sm">No story map available</p>
          </div>
        </div>
      </motion.div>
    );
  }


  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`relative ${isExpanded ? 'fixed inset-4 z-50' : ''}`}
    >
      {/* Window Container */}
      <div className="h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900/95 backdrop-blur-xl">
        {/* Window Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-white/10">
          <div className="flex items-center gap-3">
            {/* Traffic Light Dots */}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors" />
              <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
            </div>
            {/* Title */}
            <div className="flex items-center gap-2 ml-4">
              <MapIcon className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium text-slate-300">Story Map</span>
            </div>
          </div>
          
          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {/* Graph Container with Grid Pattern */}
        <div 
          className="relative" 
          style={{ height: isExpanded ? 'calc(100% - 48px)' : '500px' }}
        >
          {/* Subtle Grid Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: `
                linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />
          
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            connectionLineType={ConnectionLineType.SmoothStep}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            attributionPosition="bottom-left"
            proOptions={{ hideAttribution: true }}
          >
            <Background 
              color="rgba(139, 92, 246, 0.15)" 
              gap={40}
              size={1}
            />
            <Controls 
              className="!bg-slate-800/80 !border-white/10 !shadow-xl [&>button]:!bg-slate-700/80 [&>button]:!border-white/10 [&>button]:!text-slate-300 [&>button:hover]:!bg-violet-600/50"
            />
            <CenterOnCurrentNode currentTaleId={currentTaleId} nodes={nodes} />
          </ReactFlow>
          
          {/* Legend - Fixed position */}
          <div className="absolute top-4 right-4 z-10 bg-slate-800/90 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/10">
            <p className="text-xs text-slate-400 mb-2 font-medium">Legend</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 rounded bg-slate-900/90 border border-violet-500 shadow-[0_0_6px_rgba(139,92,246,0.5)]" />
                <span className="text-xs text-slate-300">You are here</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 rounded bg-slate-900/90 border border-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.3)]" />
                <span className="text-xs text-slate-300">Popular path</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 border border-violet-400/50" />
                <span className="text-xs text-slate-300">Root</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-500 to-red-600 border border-amber-400/50" />
                <span className="text-xs text-slate-300">Ending</span>
              </div>
              <div className="flex items-center gap-2 mt-1 pt-1 border-t border-white/10">
                <div className="w-6 h-0.5 bg-violet-500 rounded animate-pulse" />
                <span className="text-xs text-slate-300">Winner path</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  <div className="w-3 h-0.5 bg-violet-500 rounded animate-pulse" />
                  <div className="w-3 h-0.5 bg-violet-500 rounded animate-pulse" />
                </div>
                <span className="text-xs text-slate-300">Contested (tie)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-slate-600 rounded" />
                <span className="text-xs text-slate-300">Unvoted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Backdrop for expanded mode */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </motion.div>
  );
}
