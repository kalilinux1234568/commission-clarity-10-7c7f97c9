import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, CheckCircle2, Sparkles, CalendarIcon, Plus, ArrowRight } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface SaveInvoiceDialogProps {
  totalInvoice: number;
  totalCommission: number;
  onSave: (ncf: string, invoiceDate: string) => Promise<any>;
  disabled?: boolean;
  suggestedNcf?: number | null;
}

export const SaveInvoiceDialog = ({ totalInvoice, totalCommission, onSave, disabled, suggestedNcf }: SaveInvoiceDialogProps) => {
  const [open, setOpen] = useState(false);
  const [ncfSuffix, setNcfSuffix] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [savedNcf, setSavedNcf] = useState('');

  // NCF prefix: B01 + 4 zeros, user adds last 4 digits
  const ncfPrefix = 'B01000';
  const fullNcf = `${ncfPrefix}${ncfSuffix.padStart(4, '0')}`;

  // Set suggested NCF when dialog opens
  useEffect(() => {
    if (open && suggestedNcf !== null && suggestedNcf !== undefined) {
      setNcfSuffix(String(suggestedNcf).padStart(4, '0'));
    }
  }, [open, suggestedNcf]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ncfSuffix.trim() || ncfSuffix.length !== 4) return;
    
    setLoading(true);
    const result = await onSave(fullNcf, format(invoiceDate, 'yyyy-MM-dd'));
    setLoading(false);
    
    if (result) {
      setSavedNcf(fullNcf);
      setShowSuccess(true);
    }
  };

  const handleCreateNew = () => {
    setShowSuccess(false);
    setNcfSuffix('');
    setInvoiceDate(new Date());
    setSavedNcf('');
    setOpen(false);
  };

  const handleNcfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setNcfSuffix(value);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen && showSuccess) {
        handleCreateNew();
      } else {
        setOpen(newOpen);
      }
    }}>
      <DialogTrigger asChild>
        <Button className="flex-1 gap-2 h-12 text-base gradient-primary hover:opacity-90 transition-opacity" disabled={disabled || totalInvoice === 0}>
          <Save className="h-5 w-5" />
          Guardar Factura
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md overflow-hidden">
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
            {/* Success animation */}
            <div className="relative mb-6">
              <div className="h-24 w-24 rounded-full bg-success/10 flex items-center justify-center animate-scale-in">
                <CheckCircle2 className="h-12 w-12 text-success" />
              </div>
              <div className="absolute -top-2 -right-2 animate-bounce-subtle">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-foreground mb-2">¡Factura Guardada!</h3>
            <p className="text-muted-foreground mb-2">NCF: <span className="font-mono font-semibold">{savedNcf}</span></p>
            
            {/* Commission earned */}
            <div className="flex items-center gap-2 mt-2 mb-6 px-6 py-3 rounded-xl bg-success/10 border border-success/30">
              <TrendingUpIcon className="h-5 w-5 text-success" />
              <span className="text-success font-bold text-2xl">+${formatCurrency(totalCommission)}</span>
            </div>

            {/* Actions */}
            <div className="w-full space-y-3 mt-2">
              <Button 
                onClick={handleCreateNew}
                className="w-full h-12 gap-2 gradient-primary"
              >
                <Plus className="h-5 w-5" />
                Crear Nueva Factura
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="w-full h-11 gap-2"
              >
                Cerrar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
        <>
        <DialogHeader>
          <DialogTitle className="text-xl">Guardar Factura</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label className="text-base">Fecha de la Factura</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-12",
                    !invoiceDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {invoiceDate ? format(invoiceDate, "d 'de' MMMM, yyyy", { locale: es }) : <span>Seleccionar fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={invoiceDate}
                  onSelect={(date) => date && setInvoiceDate(date)}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Summary */}
          <div className="rounded-xl bg-muted/50 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Factura</span>
              <span className="font-bold text-lg">${formatNumber(totalInvoice)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-muted-foreground">Tu Comisión</span>
              <span className="font-bold text-xl text-primary">${formatCurrency(totalCommission)}</span>
            </div>
          </div>
          
          {/* NCF Input */}
          <div className="space-y-3">
            <Label htmlFor="ncf" className="text-base">Número de Comprobante (NCF)</Label>
            <p className="text-sm text-muted-foreground">
              Solo ingresa los últimos 4 dígitos del NCF
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center rounded-lg border border-border bg-muted/30 overflow-hidden">
                <span className="px-3 py-3 text-lg font-mono font-medium text-muted-foreground bg-muted border-r border-border">
                  {ncfPrefix}
                </span>
                <Input
                  id="ncf"
                  value={ncfSuffix}
                  onChange={handleNcfChange}
                  placeholder="0000"
                  className="border-0 text-lg font-mono font-bold text-center focus-visible:ring-0"
                  maxLength={4}
                  inputMode="numeric"
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">NCF completo:</span>
              <span className="font-mono font-bold text-foreground">{fullNcf}</span>
              {ncfSuffix.length === 4 && (
                <CheckCircle2 className="h-4 w-4 text-success" />
              )}
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 h-11">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || ncfSuffix.length !== 4}
              className="flex-1 h-11 gradient-primary"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Simple icon component for success state
const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);
