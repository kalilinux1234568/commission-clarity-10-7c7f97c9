import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Seller {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export const useSellers = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [activeSeller, setActiveSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSellers = async () => {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      toast.error('Error al cargar vendedores');
      console.error(error);
      setLoading(false);
      return;
    }
    
    // If no sellers exist, create default one
    if (!data || data.length === 0) {
      const { data: newSeller, error: insertError } = await supabase
        .from('sellers')
        .insert({ name: 'Neftalí Jiménez', is_active: true })
        .select()
        .single();
      
      if (!insertError && newSeller) {
        setSellers([newSeller]);
        setActiveSeller(newSeller);
      }
    } else {
      setSellers(data);
      // Set first active seller as default if none selected
      if (!activeSeller) {
        const firstActive = data.find(s => s.is_active);
        if (firstActive) setActiveSeller(firstActive);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const addSeller = async (name: string) => {
    const { data, error } = await supabase
      .from('sellers')
      .insert({ name, is_active: true })
      .select()
      .single();
    
    if (error) {
      toast.error('Error al agregar vendedor');
      console.error(error);
      return null;
    }
    
    setSellers([...sellers, data]);
    if (!activeSeller) setActiveSeller(data);
    toast.success('Vendedor agregado');
    return data;
  };

  const updateSeller = async (id: string, updates: Partial<Seller>) => {
    const { error } = await supabase
      .from('sellers')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      toast.error('Error al actualizar vendedor');
      console.error(error);
      return false;
    }
    
    setSellers(sellers.map(s => s.id === id ? { ...s, ...updates } : s));
    if (activeSeller?.id === id) {
      setActiveSeller({ ...activeSeller, ...updates });
    }
    toast.success('Vendedor actualizado');
    return true;
  };

  const deleteSeller = async (id: string) => {
    const { error } = await supabase
      .from('sellers')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Error al eliminar vendedor');
      console.error(error);
      return false;
    }
    
    const newSellers = sellers.filter(s => s.id !== id);
    setSellers(newSellers);
    if (activeSeller?.id === id) {
      setActiveSeller(newSellers.find(s => s.is_active) || null);
    }
    toast.success('Vendedor eliminado');
    return true;
  };

  const selectSeller = (seller: Seller | null) => {
    setActiveSeller(seller);
  };

  return { 
    sellers, 
    activeSeller, 
    loading, 
    addSeller, 
    updateSeller, 
    deleteSeller, 
    selectSeller,
    refetch: fetchSellers 
  };
};
