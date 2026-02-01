import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  performVendorRiskAssessment,
  calculateOverallScore,
} from '../lib/vendorAssessment';
import type {
  Vendor,
  VendorAssessmentHistory,
  VendorAssessmentDetails,
  VendorStatus,
  User,
} from '../types/database';

export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendors')
        .select(
          `
          *,
          contract_document:documents!contract_document_id(id, name, file_name, file_path),
          creator:users!created_by(id, name, email),
          assessor:users!last_assessed_by(id, name, email)
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendors((data as Vendor[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const createVendor = async (vendor: {
    company_name: string;
    website_url?: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    contract_document_id?: string;
    notes?: string;
  }): Promise<{ success: boolean; vendorId?: string }> => {
    try {
      // Get admin user as default creator
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1);
      const creatorId = (users as User[])?.[0]?.id;

      const { data: newVendor, error } = await supabase
        .from('vendors')
        .insert({
          company_name: vendor.company_name,
          website_url: vendor.website_url || null,
          contact_name: vendor.contact_name || null,
          contact_phone: vendor.contact_phone || null,
          contact_email: vendor.contact_email || null,
          contract_document_id: vendor.contract_document_id || null,
          notes: vendor.notes || null,
          status: 'pending' as VendorStatus,
          created_by: creatorId,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchVendors();
      return { success: true, vendorId: newVendor?.id };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vendor');
      return { success: false };
    }
  };

  const updateVendor = async (
    id: string,
    updates: Partial<{
      company_name: string;
      website_url: string | null;
      contact_name: string | null;
      contact_phone: string | null;
      contact_email: string | null;
      contract_document_id: string | null;
      notes: string | null;
      status: VendorStatus;
    }>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchVendors();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vendor');
      return false;
    }
  };

  const deleteVendor = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('vendors').delete().eq('id', id);

      if (error) throw error;
      await fetchVendors();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete vendor');
      return false;
    }
  };

  const runAssessment = async (
    vendorId: string
  ): Promise<{ success: boolean; assessment?: VendorAssessmentDetails }> => {
    try {
      // Get vendor details
      const vendor = vendors.find((v) => v.id === vendorId);
      if (!vendor) throw new Error('Vendor not found');

      // Run AI assessment
      const assessment = await performVendorRiskAssessment({
        companyName: vendor.company_name,
        websiteUrl: vendor.website_url || undefined,
        additionalContext: vendor.notes || undefined,
      });

      if (!assessment) {
        throw new Error('Assessment failed - no response from AI');
      }

      // Extract scores from assessment
      const scores = {
        supplier_identification_score: assessment.supplierIdentification?.score ?? null,
        service_description_score: assessment.serviceDescription?.score ?? null,
        information_security_score: assessment.informationSecurity?.score ?? null,
        data_protection_score: assessment.dataProtection?.score ?? null,
        compliance_certifications_score: assessment.complianceCertifications?.score ?? null,
        operational_resilience_score: assessment.operationalResilience?.score ?? null,
        incident_breach_history_score: assessment.incidentBreachHistory?.score ?? null,
        geographic_jurisdictional_score: assessment.geographicJurisdictional?.score ?? null,
        reputation_ethical_score: assessment.reputationEthical?.score ?? null,
      };

      const overallScore = calculateOverallScore(scores);

      // Update vendor with scores but keep status as 'pending' until user saves
      // Don't create history yet - that happens when user explicitly saves
      const { error: updateError } = await supabase
        .from('vendors')
        .update({
          ...scores,
          overall_score: overallScore,
          assessment_details: assessment as unknown as Record<string, unknown>,
          // Status stays 'pending' until user saves the assessment
        })
        .eq('id', vendorId);

      if (updateError) throw updateError;

      await fetchVendors();
      return { success: true, assessment };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run assessment');
      return { success: false };
    }
  };

  return {
    vendors,
    loading,
    error,
    refetch: fetchVendors,
    createVendor,
    updateVendor,
    deleteVendor,
    runAssessment,
  };
}

// Hook for single vendor with assessment history
export function useVendor(vendorId: string) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [assessmentHistory, setAssessmentHistory] = useState<
    VendorAssessmentHistory[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);

  const fetchVendor = useCallback(async () => {
    if (!vendorId) return;

    try {
      setLoading(true);

      // Fetch vendor with joins
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select(
          `
          *,
          contract_document:documents!contract_document_id(id, name, file_name, file_path),
          creator:users!created_by(id, name, email),
          assessor:users!last_assessed_by(id, name, email)
        `
        )
        .eq('id', vendorId)
        .single();

      if (vendorError) throw vendorError;
      setVendor(vendorData as Vendor);

      // Fetch assessment history
      const { data: historyData } = await supabase
        .from('vendor_assessment_history')
        .select(
          `
          *,
          performer:users!performed_by(id, name, email)
        `
        )
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      setAssessmentHistory((historyData as VendorAssessmentHistory[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vendor');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  const runAssessment = async (): Promise<boolean> => {
    if (!vendor) return false;

    try {
      setAssessmentLoading(true);
      setError(null);

      const assessment = await performVendorRiskAssessment({
        companyName: vendor.company_name,
        websiteUrl: vendor.website_url || undefined,
        additionalContext: vendor.notes || undefined,
      });

      if (!assessment) {
        throw new Error('Assessment failed - no response from AI');
      }

      const scores = {
        supplier_identification_score: assessment.supplierIdentification?.score ?? null,
        service_description_score: assessment.serviceDescription?.score ?? null,
        information_security_score: assessment.informationSecurity?.score ?? null,
        data_protection_score: assessment.dataProtection?.score ?? null,
        compliance_certifications_score: assessment.complianceCertifications?.score ?? null,
        operational_resilience_score: assessment.operationalResilience?.score ?? null,
        incident_breach_history_score: assessment.incidentBreachHistory?.score ?? null,
        geographic_jurisdictional_score: assessment.geographicJurisdictional?.score ?? null,
        reputation_ethical_score: assessment.reputationEthical?.score ?? null,
      };

      const overallScore = calculateOverallScore(scores);

      // Update vendor with scores but keep status as 'pending' until user saves/approves
      // Don't create history yet - that happens when user explicitly saves the assessment
      await supabase
        .from('vendors')
        .update({
          ...scores,
          overall_score: overallScore,
          assessment_details: assessment as unknown as Record<string, unknown>,
          // Status stays 'pending' until user saves the assessment
        })
        .eq('id', vendor.id);

      await fetchVendor();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run assessment');
      return false;
    } finally {
      setAssessmentLoading(false);
    }
  };

  // Save the current assessment to history (after manual review)
  const saveAssessment = async (): Promise<boolean> => {
    if (!vendor) return false;

    try {
      // Get admin user as assessor
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1);
      const assessorId = (users as User[])?.[0]?.id;

      // Create history record with current scores
      const { error: historyError } = await supabase
        .from('vendor_assessment_history')
        .insert({
          vendor_id: vendor.id,
          supplier_identification_score: vendor.supplier_identification_score,
          service_description_score: vendor.service_description_score,
          information_security_score: vendor.information_security_score,
          data_protection_score: vendor.data_protection_score,
          compliance_certifications_score: vendor.compliance_certifications_score,
          operational_resilience_score: vendor.operational_resilience_score,
          incident_breach_history_score: vendor.incident_breach_history_score,
          geographic_jurisdictional_score: vendor.geographic_jurisdictional_score,
          reputation_ethical_score: vendor.reputation_ethical_score,
          overall_score: vendor.overall_score,
          assessment_details: vendor.assessment_details as unknown as Record<string, unknown>,
          performed_by: assessorId,
        });

      if (historyError) throw historyError;

      // Update vendor status to 'assessed' and set assessment timestamp
      const { error: updateError } = await supabase
        .from('vendors')
        .update({
          status: 'assessed' as VendorStatus,
          last_assessed_at: new Date().toISOString(),
          last_assessed_by: assessorId,
        })
        .eq('id', vendor.id);

      if (updateError) throw updateError;

      await fetchVendor();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assessment');
      return false;
    }
  };

  const updateVendor = async (
    updates: Partial<{
      company_name: string;
      website_url: string | null;
      contact_name: string | null;
      contact_phone: string | null;
      contact_email: string | null;
      contract_document_id: string | null;
      notes: string | null;
      status: VendorStatus;
      assessment_details: VendorAssessmentDetails | null;
    }>
  ): Promise<boolean> => {
    if (!vendor) return false;

    try {
      const { error } = await supabase
        .from('vendors')
        .update(updates as Record<string, unknown>)
        .eq('id', vendor.id);

      if (error) throw error;
      await fetchVendor();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vendor');
      return false;
    }
  };

  const updateScores = async (
    updates: Partial<{
      supplier_identification_score: number | null;
      service_description_score: number | null;
      information_security_score: number | null;
      data_protection_score: number | null;
      compliance_certifications_score: number | null;
      operational_resilience_score: number | null;
      incident_breach_history_score: number | null;
      geographic_jurisdictional_score: number | null;
      reputation_ethical_score: number | null;
      overall_score: number | null;
      assessment_details: VendorAssessmentDetails | null;
    }>
  ): Promise<boolean> => {
    if (!vendor) return false;

    try {
      // Recalculate overall score if individual scores changed
      const currentScores = {
        supplier_identification_score: updates.supplier_identification_score ?? vendor.supplier_identification_score,
        service_description_score: updates.service_description_score ?? vendor.service_description_score,
        information_security_score: updates.information_security_score ?? vendor.information_security_score,
        data_protection_score: updates.data_protection_score ?? vendor.data_protection_score,
        compliance_certifications_score: updates.compliance_certifications_score ?? vendor.compliance_certifications_score,
        operational_resilience_score: updates.operational_resilience_score ?? vendor.operational_resilience_score,
        incident_breach_history_score: updates.incident_breach_history_score ?? vendor.incident_breach_history_score,
        geographic_jurisdictional_score: updates.geographic_jurisdictional_score ?? vendor.geographic_jurisdictional_score,
        reputation_ethical_score: updates.reputation_ethical_score ?? vendor.reputation_ethical_score,
      };

      const newOverallScore = calculateOverallScore(currentScores);

      const { error } = await supabase
        .from('vendors')
        .update({
          ...updates,
          overall_score: newOverallScore,
        })
        .eq('id', vendor.id);

      if (error) throw error;
      await fetchVendor();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update scores');
      return false;
    }
  };

  return {
    vendor,
    assessmentHistory,
    loading,
    error,
    assessmentLoading,
    refetch: fetchVendor,
    runAssessment,
    saveAssessment,
    updateVendor,
    updateScores,
  };
}

// Status labels for display (all statuses)
export const vendorStatusLabels: Record<VendorStatus, string> = {
  pending: 'Pending Assessment',
  assessed: 'Assessed',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
};

// Status filter options (excludes approved/rejected)
export const vendorStatusFilterOptions: Record<string, string> = {
  pending: 'Pending Assessment',
  assessed: 'Assessed',
  expired: 'Expired',
};

export const vendorStatusColors: Record<VendorStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  assessed: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-orange-100 text-orange-700',
};
