import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Asset, User } from '../types/database';

// Calculate depreciation percentage based on 5-year straight-line depreciation
export const calculateDepreciation = (purchaseDate: string | null): number => {
  if (!purchaseDate) return 100; // No purchase date = 100% (new/unknown)

  const purchase = new Date(purchaseDate);
  const now = new Date();
  const yearsOwned = (now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 365);

  // 5-year straight-line depreciation: 20% per year
  const depreciationPercent = Math.min(yearsOwned * 20, 100);
  const remainingValue = Math.max(100 - depreciationPercent, 0);

  return Math.round(remainingValue);
};

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assets')
        .select(`
          *,
          assigned_user:users!assigned_to(id, name, email, role)
        `)
        .order('asset_number');

      if (error) throw error;
      setAssets((data as Asset[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const createAsset = async (asset: {
    asset_number: string;
    description: string;
    serial_number?: string;
    location?: string;
    purchase_date?: string;
    supplier?: string;
    assigned_to?: string;
  }): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('assets')
        .insert({
          asset_number: asset.asset_number,
          description: asset.description,
          serial_number: asset.serial_number || null,
          location: asset.location || null,
          purchase_date: asset.purchase_date || null,
          supplier: asset.supplier || null,
          assigned_to: asset.assigned_to || null,
        });

      if (error) throw error;
      await fetchAssets();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset');
      return false;
    }
  };

  const updateAsset = async (
    id: string,
    updates: Partial<{
      asset_number: string;
      description: string;
      serial_number: string | null;
      location: string | null;
      purchase_date: string | null;
      supplier: string | null;
      assigned_to: string | null;
    }>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('assets')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchAssets();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update asset');
      return false;
    }
  };

  const deleteAsset = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAssets();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete asset');
      return false;
    }
  };

  // Generate next asset number
  const getNextAssetNumber = (): string => {
    if (assets.length === 0) return 'SG-001';

    const numbers = assets
      .map(a => {
        const match = a.asset_number.match(/SG-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n));

    const maxNumber = Math.max(...numbers, 0);
    return `SG-${String(maxNumber + 1).padStart(3, '0')}`;
  };

  return {
    assets,
    loading,
    error,
    refetch: fetchAssets,
    createAsset,
    updateAsset,
    deleteAsset,
    getNextAssetNumber,
  };
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('users').select('*');
      setUsers((data as User[]) || []);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  return { users, loading };
}
