/**
 * Componente de Item de Matéria Arrastável
 * 
 * Renderiza um item de matéria com drag & drop,
 * mostra progresso e permite ações de editar/deletar
 */
import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, Edit2, Trash2, GripVertical } from 'lucide-react';
import { Button } from '../ui/button';
import ProgressBar from './ProgressBar';
import { formatMinutes } from '@/lib/dashboard/timerHelpers';

const SubjectItem = memo(function SubjectItem({ 
  subject, 
  isActive, 
  onClick, 
  onEdit, 
  onDelete, 
  progress, 
  forceUpdateKey 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subject.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative backdrop-blur transition-all duration-300 cursor-grab ${
        isActive
          ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
          : 'bg-slate-700/30 hover:bg-slate-700/50 border border-transparent'
      } rounded-xl p-3`}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <button
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-200 transition-colors"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Indicador de cor */}
        <div
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            isActive ? 'scale-125' : ''
          }`}
          style={{
            backgroundColor: subject.color,
            boxShadow: isActive ? `0 0 12px ${subject.color}` : 'none'
          }}
        />

        {/* Conteúdo da matéria */}
        <div className="flex-1 cursor-pointer" onClick={onClick}>
          <div className="flex items-center justify-between mb-2">
            <span 
              className={`font-semibold text-sm ${
                isActive ? 'text-white' : 'text-gray-300'
              } transition-all`}
            >
              {subject.name}
            </span>
            <span 
              className={`text-xs ${
                isActive ? 'text-cyan-300 font-semibold' : 'text-gray-400'
              }`}
            >
              {formatMinutes(subject.time_goal)}
            </span>
          </div>

          {/* Barra de progresso */}
          <ProgressBar value={progress} forceUpdateKey={forceUpdateKey} />
        </div>

        {/* Botões de ação */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Play className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-gray-400 hover:bg-slate-600/50 hover:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(subject);
            }}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-gray-400 hover:bg-red-500/10 hover:text-red-400"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(subject.id);
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
});

export default SubjectItem;
