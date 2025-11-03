/**
 * Lista de Matérias com Drag & Drop
 * 
 * Componente que exibe a lista de matérias permitindo
 * reordenação via drag and drop
 */
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SubjectItem from './SubjectItem';

function SubjectList({ 
  subjects, 
  currentSubject, 
  localProgress,
  progressUpdateTrigger,
  onSubjectClick,
  onSubjectEdit,
  onSubjectDelete,
  onDragStart,
  onDragEnd
}) {
  // Configurar sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Calcula o progresso percentual de uma matéria
   */
  const calculateProgress = (subject) => {
    const studied = Math.max(0, localProgress?.[subject.id] || 0);
    const goal = Number(subject.time_goal || 0);
    if (!goal) return 0;
    return Math.min(100, (studied / goal) * 100);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={subjects.map(s => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {subjects.map((subject) => (
            <SubjectItem
              key={subject.id}
              subject={subject}
              isActive={currentSubject?.id === subject.id}
              onClick={() => onSubjectClick(subject)}
              onEdit={onSubjectEdit}
              onDelete={onSubjectDelete}
              progress={calculateProgress(subject)}
              forceUpdateKey={progressUpdateTrigger}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export default SubjectList;
