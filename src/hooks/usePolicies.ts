import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Policy, PolicyVersion, WorkflowHistory, User } from '../types/database';
import { generateChangeDiff, reviewDocumentForGaps, type DocumentReview } from '../lib/openai';

// Helper to format version as string
const formatVersion = (major: number, minor: number) => `${major}.${minor}`;

export function usePolicies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .order('title');

      if (error) throw error;
      setPolicies((data as Policy[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch policies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const createPolicy = async (): Promise<string | null> => {
    try {
      // Get admin user for created_by
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1);
      const adminId = (users as User[])?.[0]?.id;

      // Generate unique title
      const timestamp = Date.now();
      const title = `New Policy ${new Date().toLocaleDateString()}`;
      const slug = `new-policy-${timestamp}`;

      const defaultContent = `# ${title}

## 1 Introduction

[Add introduction here]

## 2 Policy

[Add policy content here]

## 3 Responsibilities

[Define responsibilities here]
`;

      const { data: newPolicy, error: createError } = await supabase
        .from('policies')
        .insert({
          title,
          slug,
          content: defaultContent,
          current_version: 1,
          major_version: 1,
          minor_version: 0,
          workflow_status: 'draft'
        })
        .select()
        .single();

      if (createError) throw createError;

      // Create initial version record
      if (newPolicy && adminId) {
        await supabase
          .from('policy_versions')
          .insert({
            policy_id: newPolicy.id,
            version_number: 1,
            version_label: '1.0',
            content: defaultContent,
            change_summary: 'Initial creation',
            created_by: adminId
          });

        // Record creation in workflow history
        await supabase
          .from('workflow_history')
          .insert({
            policy_id: newPolicy.id,
            action: 'created',
            performed_by: adminId,
            to_version: '1.0',
            comments: 'Policy created'
          });
      }

      await fetchPolicies();
      return slug;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create policy');
      return null;
    }
  };

  return { policies, loading, error, refetch: fetchPolicies, createPolicy };
}

export function usePolicy(slug: string) {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [workflowHistory, setWorkflowHistory] = useState<WorkflowHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentReview, setDocumentReview] = useState<DocumentReview | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchPolicy = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch policy
      const { data: policyData, error: policyError } = await supabase
        .from('policies')
        .select('*')
        .eq('slug', slug)
        .single();

      if (policyError) throw policyError;
      setPolicy(policyData as Policy);

      // Fetch versions
      if (policyData) {
        const { data: versionsData } = await supabase
          .from('policy_versions')
          .select('*')
          .eq('policy_id', (policyData as Policy).id)
          .order('version_number', { ascending: false });

        setVersions((versionsData as PolicyVersion[]) || []);

        // Fetch workflow history with user data
        const { data: historyData } = await supabase
          .from('workflow_history')
          .select(`
            *,
            user:users!performed_by(id, name, email, role)
          `)
          .eq('policy_id', (policyData as Policy).id)
          .order('created_at', { ascending: false });

        setWorkflowHistory((historyData as WorkflowHistory[]) || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch policy');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchPolicy();
    }
  }, [slug, fetchPolicy]);

  const updatePolicy = async (content: string, changeSummary: string, userId?: string) => {
    if (!policy) return;

    try {
      // Get user ID - use provided or fetch admin as fallback
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: users } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'admin')
          .limit(1);
        currentUserId = (users as User[])?.[0]?.id || policy.id;
      }

      // Generate diff of changes
      const changesDiff = await generateChangeDiff(policy.content, content);

      // Calculate new version - minor version bump for edits
      const newVersionNumber = policy.current_version + 1;
      const majorVersion = policy.major_version || 1;
      const newMinorVersion = (policy.minor_version || 0) + 1;
      const fromVersion = formatVersion(majorVersion, policy.minor_version || 0);
      const toVersion = formatVersion(majorVersion, newMinorVersion);

      const { error: versionError } = await supabase
        .from('policy_versions')
        .insert({
          policy_id: policy.id,
          version_number: newVersionNumber,
          version_label: toVersion,
          content: content,
          change_summary: changeSummary,
          changes_diff: changesDiff as unknown as Record<string, unknown>,
          created_by: currentUserId
        });

      if (versionError) throw versionError;

      // Update policy with new minor version
      const { error: updateError } = await supabase
        .from('policies')
        .update({
          content: content,
          current_version: newVersionNumber,
          major_version: majorVersion,
          minor_version: newMinorVersion,
          workflow_status: 'draft'
        })
        .eq('id', policy.id);

      if (updateError) throw updateError;

      // Record edit in workflow history
      await supabase
        .from('workflow_history')
        .insert({
          policy_id: policy.id,
          action: 'edited',
          performed_by: currentUserId,
          from_version: fromVersion,
          to_version: toVersion,
          comments: changeSummary
        });

      await fetchPolicy();

      // Trigger AI review after save
      runDocumentReview(content);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update policy');
      return false;
    }
  };

  const runDocumentReview = async (content?: string) => {
    if (!policy && !content) return;

    setReviewLoading(true);
    try {
      const review = await reviewDocumentForGaps(
        content || policy?.content || '',
        policy?.title || 'IT policy'
      );
      setDocumentReview(review);
    } catch (err) {
      console.error('Error running document review:', err);
    } finally {
      setReviewLoading(false);
    }
  };

  const submitForReview = async (userId?: string) => {
    if (!policy) return;

    try {
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: users } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'admin')
          .limit(1);
        currentUserId = (users as User[])?.[0]?.id || policy.id;
      }

      const currentVersion = formatVersion(policy.major_version || 1, policy.minor_version || 0);

      await supabase
        .from('policies')
        .update({ workflow_status: 'pending_review' })
        .eq('id', policy.id);

      await supabase
        .from('workflow_history')
        .insert({
          policy_id: policy.id,
          action: 'submitted',
          performed_by: currentUserId,
          to_version: currentVersion,
          comments: `Submitted version ${currentVersion} for review`
        });

      await fetchPolicy();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit for review');
    }
  };

  const reviewPolicy = async (approved: boolean, comments: string, userId?: string) => {
    if (!policy) return;

    try {
      let reviewerId = userId;
      if (!reviewerId) {
        const { data: users } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'reviewer')
          .limit(1);
        reviewerId = (users as User[])?.[0]?.id || policy.id;
      }

      const currentVersion = formatVersion(policy.major_version || 1, policy.minor_version || 0);
      const newStatus = approved ? 'pending_approval' : 'draft';

      await supabase
        .from('policies')
        .update({
          workflow_status: newStatus,
          reviewer_id: reviewerId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', policy.id);

      await supabase
        .from('workflow_history')
        .insert({
          policy_id: policy.id,
          action: approved ? 'reviewed' : 'revision_requested',
          performed_by: reviewerId,
          to_version: currentVersion,
          comments
        });

      await fetchPolicy();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to review policy');
    }
  };

  const approvePolicy = async (approved: boolean, comments: string, userId?: string) => {
    if (!policy) return;

    try {
      let approverId = userId;
      if (!approverId) {
        const { data: users } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'approver')
          .limit(1);
        approverId = (users as User[])?.[0]?.id || policy.id;
      }

      const currentVersion = formatVersion(policy.major_version || 1, policy.minor_version || 0);

      if (approved) {
        // Major version bump on approval (e.g., 1.3 -> 2.0)
        const newMajorVersion = (policy.major_version || 1) + 1;
        const newVersion = formatVersion(newMajorVersion, 0);

        await supabase
          .from('policies')
          .update({
            workflow_status: 'approved',
            major_version: newMajorVersion,
            minor_version: 0,
            approver_id: approverId,
            approved_at: new Date().toISOString()
          })
          .eq('id', policy.id);

        await supabase
          .from('workflow_history')
          .insert({
            policy_id: policy.id,
            action: 'approved',
            performed_by: approverId,
            from_version: currentVersion,
            to_version: newVersion,
            comments
          });
      } else {
        // Rejection - no version change
        await supabase
          .from('policies')
          .update({
            workflow_status: 'draft',
            approver_id: approverId
          })
          .eq('id', policy.id);

        await supabase
          .from('workflow_history')
          .insert({
            policy_id: policy.id,
            action: 'rejected',
            performed_by: approverId,
            to_version: currentVersion,
            comments
          });
      }

      await fetchPolicy();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve policy');
    }
  };

  const updateTitle = async (newTitle: string) => {
    if (!policy || !newTitle.trim()) return false;

    try {
      const { error: updateError } = await supabase
        .from('policies')
        .update({ title: newTitle.trim() })
        .eq('id', policy.id);

      if (updateError) throw updateError;

      await fetchPolicy();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update title');
      return false;
    }
  };

  return {
    policy,
    versions,
    workflowHistory,
    loading,
    error,
    updatePolicy,
    updateTitle,
    submitForReview,
    reviewPolicy,
    approvePolicy,
    refetch: fetchPolicy,
    documentReview,
    reviewLoading,
    runDocumentReview,
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
