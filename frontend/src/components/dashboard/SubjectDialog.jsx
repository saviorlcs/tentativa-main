/**
 * Diálogo para Adicionar/Editar Matérias
 * 
 * Modal reutilizável para criar novas matérias ou editar existentes
 */
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

function SubjectDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  subject = null,
  mode = 'add' // 'add' ou 'edit'
}) {
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    time_goal: 300 // 5 horas em minutos
  });

  // Preenche formulário ao editar
  useEffect(() => {
    if (subject && mode === 'edit') {
      setFormData({
        name: subject.name || '',
        color: subject.color || '#3B82F6',
        time_goal: subject.time_goal || 300
      });
    } else {
      // Reset ao adicionar nova matéria
      setFormData({
        name: '',
        color: '#3B82F6',
        time_goal: 300
      });
    }
  }, [subject, mode, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    onSave(formData);
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Editar Matéria' : 'Nova Matéria'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome da matéria */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Matéria</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ex: Matemática"
              required
            />
          </div>

          {/* Cor */}
          <div className="space-y-2">
            <Label htmlFor="color">Cor</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
          </div>

          {/* Meta de tempo */}
          <div className="space-y-2">
            <Label htmlFor="time_goal">Meta de Tempo (minutos)</Label>
            <Input
              id="time_goal"
              type="number"
              min="1"
              value={formData.time_goal}
              onChange={(e) => handleChange('time_goal', parseInt(e.target.value) || 0)}
              placeholder="300"
              required
            />
            <p className="text-xs text-gray-400">
              {Math.floor(formData.time_goal / 60)}h {formData.time_goal % 60}min
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-2 justify-end pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {mode === 'edit' ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default SubjectDialog;
