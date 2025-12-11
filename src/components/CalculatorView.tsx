import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RotateCcw, Calculator, DollarSign, Check, Package, CalendarIcon, FileText, CheckCircle2 } from "lucide-react";
import { SaveInvoiceDialog } from "@/components/SaveInvoiceDialog";
import { EditRestPercentageDialog } from "@/components/EditRestPercentageDialog";
import { BreakdownTable } from "@/components/BreakdownTable";
import { ProductManager } from "@/components/ProductManager";
import { formatNumber, formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Seller } from "@/hooks/useSellers";

interface Product {
  id: string;
  name: string;
  percentage: number;
  color: string;
  is_default: boolean;
}

interface Breakdown {
  name: string;
  label: string;
  amount: number;
  percentage: number;
  commission: number;
  color: string;
}

interface Calculations {
  breakdown: Breakdown[];
  restAmount: number;
  restCommission: number;
  totalCommission: number;
}

interface CalculatorViewProps {
  products: Product[];
  productAmounts: Record<string, number>;
  totalInvoice: number;
  setTotalInvoice: (value: number) => void;
  calculations: Calculations;
  restPercentage: number;
  isLoading: boolean;
  onProductChange: (id: string, value: number) => void;
  onReset: () => void;
  onAddProduct: (name: string, percentage: number) => Promise<any>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
  onDeleteProduct: (id: string) => void;
  onUpdateRestPercentage: (value: number) => Promise<boolean>;
  onSaveInvoice: (ncf: string, invoiceDate: string) => Promise<any>;
  suggestedNcf?: number | null;
  activeSeller?: Seller | null;
}

export const CalculatorView = ({
  products,
  productAmounts,
  totalInvoice,
  setTotalInvoice,
  calculations,
  restPercentage,
  isLoading,
  onProductChange,
  onReset,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateRestPercentage,
  onSaveInvoice,
  suggestedNcf,
  activeSeller,
}: CalculatorViewProps) => {
  const [displayValue, setDisplayValue] = useState(totalInvoice > 0 ? formatNumber(totalInvoice) : '');
  const [productDisplayValues, setProductDisplayValues] = useState<Record<string, string>>({});
  
  // Step 1: NCF and Date fields (shown first)
  const [ncfSuffix, setNcfSuffix] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [step1Complete, setStep1Complete] = useState(false);

  const ncfPrefix = 'B01000';

  // Initialize NCF from suggested value
  useState(() => {
    if (suggestedNcf !== null && suggestedNcf !== undefined) {
      setNcfSuffix(String(suggestedNcf).padStart(4, '0'));
    }
  });

  const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '');
    if (raw && !/^\d+$/.test(raw)) return;
    
    const numValue = parseInt(raw, 10) || 0;
    setTotalInvoice(numValue);
    
    if (numValue > 0) {
      setDisplayValue(formatNumber(numValue));
    } else {
      setDisplayValue('');
    }
  };

  const handleProductAmountChange = (id: string, value: string) => {
    const raw = value.replace(/,/g, '');
    if (raw && !/^\d+$/.test(raw)) return;
    
    const numValue = parseInt(raw, 10) || 0;
    onProductChange(id, numValue);
    
    if (numValue > 0) {
      setProductDisplayValues(prev => ({ ...prev, [id]: formatNumber(numValue) }));
    } else {
      setProductDisplayValues(prev => ({ ...prev, [id]: '' }));
    }
  };

  const handleReset = () => {
    setDisplayValue('');
    setProductDisplayValues({});
    setNcfSuffix('');
    setInvoiceDate(new Date());
    setStep1Complete(false);
    onReset();
  };

  const handleNcfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setNcfSuffix(value);
  };

  const handleContinue = () => {
    if (ncfSuffix.length === 4) {
      setStep1Complete(true);
    }
  };

  const handleSaveInvoice = async () => {
    const fullNcf = `${ncfPrefix}${ncfSuffix.padStart(4, '0')}`;
    const result = await onSaveInvoice(fullNcf, format(invoiceDate, 'yyyy-MM-dd'));
    if (result) {
      handleReset();
    }
    return result;
  };

  const fullNcf = `${ncfPrefix}${ncfSuffix.padStart(4, '0')}`;
  const hasResult = totalInvoice > 0;
  const canProceed = ncfSuffix.length === 4;

  return (
    <div className="animate-fade-in">
      <div className={`grid gap-6 ${step1Complete && hasResult ? 'lg:grid-cols-2' : 'max-w-xl mx-auto'}`}>
        {/* Left Column - Calculator */}
        <Card className="overflow-hidden card-shadow hover-lift">
          {/* Header */}
          <div className="gradient-primary px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-primary-foreground">Calculadora de Comisiones</h1>
                <p className="text-primary-foreground/70 text-sm">
                  {activeSeller ? `Vendedor: ${activeSeller.name}` : 'Calcula tu ganancia rápidamente'}
                </p>
              </div>
            </div>
          </div>

          {/* Step 1: NCF and Date */}
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-2 mb-4">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step1Complete ? 'bg-success text-success-foreground' : 'bg-primary text-primary-foreground'
              }`}>
                {step1Complete ? <Check className="h-4 w-4" /> : '1'}
              </div>
              <h3 className="font-semibold text-foreground">Datos de la Factura</h3>
            </div>

            <div className="space-y-4">
              {/* Date Picker */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fecha de la Factura</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-11",
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

              {/* NCF Input */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">NCF (últimos 4 dígitos)</Label>
                <div className="flex items-center rounded-lg border border-border bg-muted/30 overflow-hidden">
                  <span className="px-3 py-2.5 text-base font-mono font-medium text-muted-foreground bg-muted border-r border-border">
                    {ncfPrefix}
                  </span>
                  <Input
                    value={ncfSuffix}
                    onChange={handleNcfChange}
                    placeholder="0000"
                    className="border-0 text-base font-mono font-bold text-center focus-visible:ring-0 h-11"
                    maxLength={4}
                    inputMode="numeric"
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">NCF completo: <span className="font-mono font-semibold text-foreground">{fullNcf}</span></span>
                  {canProceed && <CheckCircle2 className="h-4 w-4 text-success" />}
                </div>
              </div>

              {/* Continue Button - only show if not yet proceeded */}
              {!step1Complete && (
                <Button 
                  onClick={handleContinue} 
                  disabled={!canProceed}
                  className="w-full h-11 gradient-primary"
                >
                  Continuar
                </Button>
              )}
            </div>
          </div>

          {/* Step 2: Invoice Total - only show after step 1 */}
          {step1Complete && (
            <>
              <div className="p-5 border-b border-border">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    hasResult ? 'bg-success text-success-foreground' : 'bg-primary text-primary-foreground'
                  }`}>
                    {hasResult ? <Check className="h-4 w-4" /> : '2'}
                  </div>
                  <h3 className="font-semibold text-foreground">Total de la Factura</h3>
                </div>
                
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground group-focus-within:text-primary transition-colors">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={handleTotalChange}
                    className="w-full h-14 pl-9 pr-4 text-2xl font-bold text-foreground rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all hover:border-primary/50"
                    placeholder="0"
                  />
                </div>
                {hasResult && (
                  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5 animate-fade-in">
                    <Check className="h-3.5 w-3.5 text-success" />
                    Factura registrada
                  </p>
                )}
              </div>

              {/* Products Section */}
              {hasResult && (
                <div className="border-b border-border">
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-7 w-7 rounded-md bg-accent/10 flex items-center justify-center">
                        <Package className="h-4 w-4 text-accent" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">Productos con Comisión Variable</h3>
                    </div>
                    
                    {isLoading ? (
                      <div className="space-y-2">
                        {[1, 2].map(i => (
                          <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                        ))}
                      </div>
                    ) : (
                      <ProductManager
                        products={products}
                        productAmounts={productAmounts}
                        productDisplayValues={productDisplayValues}
                        onProductChange={handleProductAmountChange}
                        onDeleteProduct={onDeleteProduct}
                        onUpdateProduct={onUpdateProduct}
                        onAddProduct={onAddProduct}
                      />
                    )}
                    
                    {/* Rest info */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 text-sm mt-3">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {restPercentage}%
                        </span>
                        <span className="text-muted-foreground">Resto</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">${formatNumber(calculations.restAmount)}</span>
                        <EditRestPercentageDialog 
                          currentValue={restPercentage} 
                          onUpdate={onUpdateRestPercentage} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Result Section - Mobile */}
              {hasResult && (
                <div className="p-5 gradient-success lg:hidden">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-success-foreground/80 mb-0.5">Tu comisión total</p>
                      <p className="text-3xl font-bold text-success-foreground animate-number">
                        ${formatCurrency(calculations.totalCommission)}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-success-foreground/20 flex items-center justify-center animate-pulse-soft">
                      <DollarSign className="h-6 w-6 text-success-foreground" />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Right Column - Breakdown Table */}
        {step1Complete && hasResult && (
          <div className="space-y-4">
            <BreakdownTable
              totalInvoice={totalInvoice}
              breakdown={calculations.breakdown}
              restAmount={calculations.restAmount}
              restPercentage={restPercentage}
              restCommission={calculations.restCommission}
              totalCommission={calculations.totalCommission}
            />
            
            {/* Actions */}
            <div className="flex gap-3 animate-slide-up">
              <Button
                className="flex-1 gap-2 h-12 text-base gradient-primary hover:opacity-90 transition-opacity"
                disabled={totalInvoice === 0}
                onClick={handleSaveInvoice}
              >
                <FileText className="h-5 w-5" />
                Guardar Factura
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="gap-2 h-11 flex-1"
              >
                <RotateCcw className="h-4 w-4" />
                Limpiar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Prompt - When not started */}
      {!step1Complete && (
        <div className="max-w-xl mx-auto mt-4">
          <p className="text-center text-muted-foreground text-sm">
            Ingresa la fecha y el NCF para comenzar
          </p>
        </div>
      )}
    </div>
  );
};
