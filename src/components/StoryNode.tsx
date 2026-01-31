import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

export interface StoryNodeData {
  label: string;
  nodeType: 'ROOT' | 'BRANCH' | 'LEAF';
  isCurrent: boolean;
  isOnWinnerPath: boolean;
  isDeleted: boolean;
}

const StoryNode = memo(({ data }: NodeProps<StoryNodeData>) => {
  const { label, nodeType, isCurrent, isOnWinnerPath, isDeleted } = data;

  // Determine border styling based on node state
  const getBorderClass = () => {
    if (isDeleted) {
      return 'border-dashed border-slate-600';
    }
    if (isCurrent) {
      return 'border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.5)]';
    }
    if (isOnWinnerPath) {
      return 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]';
    }
    return 'border-slate-700';
  };

  // Determine accent color for node type indicator
  const getTypeIndicator = () => {
    switch (nodeType) {
      case 'ROOT':
        return (
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 border border-violet-400/50" />
        );
      case 'LEAF':
        return (
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-br from-amber-500 to-red-600 border border-amber-400/50" />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Invisible Target Handle (left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!opacity-0 !w-2 !h-2"
      />

      {/* Node Content */}
      <div
        className={`
          relative
          min-w-[150px] max-w-[200px]
          px-3 py-2
          rounded-xl
          bg-slate-900/90 backdrop-blur-sm
          border-2 ${getBorderClass()}
          transition-all duration-200
          hover:bg-slate-800/90
          cursor-pointer
          ${isDeleted ? 'opacity-50' : ''}
        `}
      >
        {/* Type Indicator Badge */}
        {!isDeleted && getTypeIndicator()}

        {/* Text Label */}
        <p className={`text-xs text-left leading-relaxed line-clamp-2 font-sans ${isDeleted ? 'text-slate-500' : 'text-slate-200'}`}>
          {isDeleted ? '[Deleted]' : (label || 'Untitled')}
        </p>
      </div>

      {/* Invisible Source Handle (right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!opacity-0 !w-2 !h-2"
      />
    </>
  );
});

StoryNode.displayName = 'StoryNode';

export default StoryNode;
