import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Settings2, Trash2, Check, User } from 'lucide-react';
import { Seller } from '@/hooks/useSellers';

interface SellerManagerProps {
  sellers: Seller[];
  activeSeller: Seller | null;
  onSelectSeller: (seller: Seller | null) => void;
  onAddSeller: (name: string) => Promise<any>;
  onUpdateSeller: (id: string, updates: Partial<Seller>) => Promise<boolean>;
  onDeleteSeller: (id: string) => Promise<boolean>;
}

export const SellerManager = ({
  sellers,
  activeSeller,
  onSelectSeller,
  onAddSeller,
  onUpdateSeller,
  onDeleteSeller,
}: SellerManagerProps) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [newSellerName, setNewSellerName] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [editingSeller, setEditingSeller] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAddSeller = async () => {
    if (!newSellerName.trim()) return;
    setAddLoading(true);
    const result = await onAddSeller(newSellerName.trim());
    setAddLoading(false);
    if (result) {
      setNewSellerName('');
      setShowAddDialog(false);
    }
  };

  const handleStartEdit = (seller: Seller) => {
    setEditingSeller(seller.id);
    setEditName(seller.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    await onUpdateSeller(id, { name: editName.trim() });
    setEditingSeller(null);
  };

  const activeSellers = sellers.filter(s => s.is_active);

  return (
    <div className="flex items-center gap-2">
      {/* Seller Selector */}
      <Select 
        value={activeSeller?.id || ''} 
        onValueChange={(value) => {
          const seller = sellers.find(s => s.id === value);
          onSelectSeller(seller || null);
        }}
      >
        <SelectTrigger className="w-48 h-9 bg-card border-border">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <SelectValue placeholder="Seleccionar vendedor" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {activeSellers.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground text-center">
              No hay vendedores
            </div>
          ) : (
            activeSellers.map(seller => (
              <SelectItem key={seller.id} value={seller.id}>
                {seller.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Add Seller Button */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Vendedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seller-name">Nombre del Vendedor</Label>
              <Input
                id="seller-name"
                value={newSellerName}
                onChange={(e) => setNewSellerName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                onKeyDown={(e) => e.key === 'Enter' && handleAddSeller()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddSeller} 
                disabled={addLoading || !newSellerName.trim()}
                className="gradient-primary"
              >
                {addLoading ? 'Agregando...' : 'Agregar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Sellers Button */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <Settings2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestionar Vendedores
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {sellers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay vendedores registrados
              </p>
            ) : (
              sellers.map(seller => (
                <div 
                  key={seller.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  {editingSeller === seller.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(seller.id);
                          if (e.key === 'Escape') setEditingSeller(null);
                        }}
                      />
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8"
                        onClick={() => handleSaveEdit(seller.id)}
                      >
                        <Check className="h-4 w-4 text-success" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-foreground">{seller.name}</span>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleStartEdit(seller)}
                        >
                          <Settings2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onDeleteSeller(seller.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
