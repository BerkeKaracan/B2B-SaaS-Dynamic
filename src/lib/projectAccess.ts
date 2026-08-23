export type GrantPermission = 'view' | 'edit';

export type DepartmentGrant = {
  department_id: string;
  permission: GrantPermission;
};

export type CustomRoleGrant = {
  custom_role_id: string;
  permission: GrantPermission;
};

export function resolveVisibilityMode(
  data?: { visibility?: string; visibility_mode?: string } | null
): string {
  if (!data) return 'private';
  const raw = data.visibility_mode || data.visibility || 'private';
  if (raw === 'public') return 'open';
  if (raw === 'just_admin') return 'admin_only';
  return String(raw);
}

export function visibilityToRecordPayload(
  currentData: Record<string, unknown>,
  mode: string
): Record<string, unknown> {
  const legacy = {
    private: 'private',
    open: 'public',
    admin_only: 'just_admin',
    department: 'department',
  } as const;
  return {
    ...currentData,
    visibility_mode: mode,
    visibility: legacy[mode as keyof typeof legacy] ?? mode,
  };
}

export function departmentGrantsToIds(grants: DepartmentGrant[]): string[] {
  return grants.map((g) => g.department_id);
}

export function grantsFromAccessResponse(
  grants: Array<{
    subject_type?: string;
    subject_id?: string;
    permission?: string;
  }>
): { departmentGrants: DepartmentGrant[]; customRoleGrants: CustomRoleGrant[] } {
  const departmentGrants: DepartmentGrant[] = [];
  const customRoleGrants: CustomRoleGrant[] = [];
  const deptBest = new Map<string, GrantPermission>();

  for (const g of grants) {
    const perm = g.permission === 'edit' ? 'edit' : 'view';
    if (g.subject_type === 'department' && g.subject_id) {
      const existing = deptBest.get(g.subject_id);
      if (!existing || (perm === 'edit' && existing === 'view')) {
        deptBest.set(g.subject_id, perm);
      }
    }
    if (g.subject_type === 'custom_role' && g.subject_id) {
      customRoleGrants.push({
        custom_role_id: g.subject_id,
        permission: perm,
      });
    }
  }

  deptBest.forEach((permission, department_id) => {
    departmentGrants.push({ department_id, permission });
  });

  return { departmentGrants, customRoleGrants };
}

export function buildAccessPutBody(
  visibilityMode: string,
  departmentGrants: DepartmentGrant[],
  customRoleGrants?: CustomRoleGrant[]
) {
  const body: {
    visibility_mode: string;
    department_ids: string[];
    department_grants: DepartmentGrant[];
    grants?: Array<{
      subject_type: 'custom_role';
      subject_id: string;
      permission: GrantPermission;
    }>;
  } = {
    visibility_mode: visibilityMode,
    department_ids: departmentGrantsToIds(departmentGrants),
    department_grants: departmentGrants.map((g) => ({
      department_id: g.department_id,
      permission: g.permission,
    })),
  };
  if (customRoleGrants !== undefined) {
    body.grants = customRoleGrants.map((g) => ({
      subject_type: 'custom_role' as const,
      subject_id: g.custom_role_id,
      permission: g.permission,
    }));
  }
  return body;
}
