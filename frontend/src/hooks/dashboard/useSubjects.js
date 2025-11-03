/**
 * Hook para gerenciamento de matérias
 * 
 * Gerencia operações CRUD de matérias, incluindo:
 * - Carregar matérias do backend
 * - Adicionar nova matéria
 * - Editar matéria existente
 * - Deletar matéria
 * - Reordenar matérias (drag & drop)
 */
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { arrayMove } from '@dnd-kit/sortable';
import { generateUniqueColor } from '@/lib/dashboard/colorGenerator';

const STORAGE_KEY_CURRENT_SUBJECT = 'pomociclo_current_subject_id';

export function useSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Carrega matérias do backend
   */
  const loadSubjects = useCallback(async () => {
    try {
      const response = await api.get('/subjects');
      const sortedSubjects = (response.data || []).sort((a, b) => a.order - b.order);
      setSubjects(sortedSubjects);

      // Restaura matéria atual do localStorage se houver
      const savedSubjectId = localStorage.getItem(STORAGE_KEY_CURRENT_SUBJECT);
      const savedSubject = sortedSubjects.find(s => s.id === savedSubjectId);
      
      if (!currentSubject) {
        if (savedSubject) {
          setCurrentSubject(savedSubject);
          console.log('[useSubjects] Restaurando matéria salva:', savedSubject.name);
        } else if (sortedSubjects.length > 0) {
          setCurrentSubject(sortedSubjects[0]);
          console.log('[useSubjects] Selecionando primeira matéria:', sortedSubjects[0].name);
        }
      }

      setLoading(false);
      return sortedSubjects;
    } catch (error) {
      console.error('[useSubjects] Erro ao carregar matérias:', error);
      toast.error('Erro ao carregar matérias');
      setLoading(false);
      return [];
    }
  }, [currentSubject]);

  /**
   * Adiciona nova matéria
   */
  const addSubject = useCallback(async (subjectData) => {
    try {
      const existingColors = subjects.map(s => s.color);
      const newSubjectData = {
        ...subjectData,
        color: subjectData.color || generateUniqueColor(existingColors),
        order: subjects.length
      };

      const response = await api.post('/subjects', newSubjectData);
      const newSubject = response.data;

      setSubjects(prev => [...prev, newSubject]);
      
      // Se não há matéria atual, seleciona a nova
      if (!currentSubject) {
        setCurrentSubject(newSubject);
      }

      toast.success('Matéria adicionada!');
      return newSubject;
    } catch (error) {
      console.error('[useSubjects] Erro ao adicionar matéria:', error);
      toast.error('Erro ao adicionar matéria');
      return null;
    }
  }, [subjects, currentSubject]);

  /**
   * Atualiza matéria existente
   */
  const updateSubject = useCallback(async (subjectId, updates) => {
    try {
      const response = await api.put(`/subjects/${subjectId}`, updates);
      const updatedSubject = response.data;

      setSubjects(prev => 
        prev.map(s => s.id === subjectId ? updatedSubject : s)
      );

      // Se a matéria atual foi atualizada, atualiza o estado
      if (currentSubject?.id === subjectId) {
        setCurrentSubject(updatedSubject);
      }

      toast.success('Matéria atualizada!');
      return updatedSubject;
    } catch (error) {
      console.error('[useSubjects] Erro ao atualizar matéria:', error);
      toast.error('Erro ao atualizar matéria');
      return null;
    }
  }, [currentSubject]);

  /**
   * Deleta matéria
   */
  const deleteSubject = useCallback(async (subjectId) => {
    try {
      await api.delete(`/subjects/${subjectId}`);

      setSubjects(prev => {
        const filtered = prev.filter(s => s.id !== subjectId);
        
        // Se deletou a matéria atual, seleciona outra
        if (currentSubject?.id === subjectId) {
          setCurrentSubject(filtered.length > 0 ? filtered[0] : null);
        }
        
        return filtered;
      });

      toast.success('Matéria removida!');
    } catch (error) {
      console.error('[useSubjects] Erro ao deletar matéria:', error);
      toast.error('Erro ao deletar matéria');
    }
  }, [currentSubject]);

  /**
   * Reordena matérias após drag & drop
   */
  const reorderSubjects = useCallback(async (activeId, overId) => {
    const oldIndex = subjects.findIndex(s => s.id === activeId);
    const newIndex = subjects.findIndex(s => s.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(subjects, oldIndex, newIndex);
    setSubjects(newOrder);

    // Atualiza ordem no backend
    try {
      await api.put('/subjects/reorder', {
        subject_ids: newOrder.map(s => s.id)
      });
    } catch (error) {
      console.error('[useSubjects] Erro ao reordenar matérias:', error);
      toast.error('Erro ao salvar nova ordem');
      // Reverte em caso de erro
      setSubjects(subjects);
    }
  }, [subjects]);

  /**
   * Seleciona matéria atual
   */
  const selectSubject = useCallback((subject) => {
    setCurrentSubject(subject);
    
    // Salva no localStorage
    if (subject) {
      localStorage.setItem(STORAGE_KEY_CURRENT_SUBJECT, subject.id);
    }
  }, []);

  return {
    subjects,
    currentSubject,
    loading,
    loadSubjects,
    addSubject,
    updateSubject,
    deleteSubject,
    reorderSubjects,
    selectSubject,
    setCurrentSubject
  };
}
