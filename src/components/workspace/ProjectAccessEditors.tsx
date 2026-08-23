'use client';

import { Users, Shield } from 'lucide-react';
import type {
  CustomRoleGrant,
  DepartmentGrant,
  GrantPermission,
} from '@/lib/projectAccess';

type NamedItem = { id: string; name: string };

type DepartmentGrantEditorProps = {
  departments: NamedItem[];
  grants: DepartmentGrant[];
  onChange: (grants: DepartmentGrant[]) => void;
  disabled?: boolean;
  labels: {
    title: string;
    desc: string;
    empty: string;
    view: string;
    edit: string;
  };
};

export function DepartmentGrantEditor({
  departments,
  grants,
  onChange,
  disabled,
  labels,
}: DepartmentGrantEditorProps) {
  const grantMap = new Map(grants.map((g) => [g.department_id, g.permission]));

  const toggle = (deptId: string) => {
    if (grantMap.has(deptId)) {
      onChange(grants.filter((g) => g.department_id !== deptId));
      return;
    }
    onChange([...grants, { department_id: deptId, permission: 'view' }]);
  };

  const setPermission = (deptId: string, permission: GrantPermission) => {
    onChange(
      grants.map((g) =>
        g.department_id === deptId ? { ...g, permission } : g
      )
    );
  };

  if (departments.length === 0) {
    return <p className="text-xs text-zinc-400 italic">{labels.empty}</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-zinc-500" />
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          {labels.title}
        </p>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{labels.desc}</p>
      <div className="space-y-2">
        {departments.map((dept) => {
          const selected = grantMap.has(dept.id);
          const permission = grantMap.get(dept.id) || 'view';
          return (
            <div
              key={dept.id}
              className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${
                selected
                  ? 'border-sky-200 dark:border-sky-500/30 bg-sky-50/50 dark:bg-sky-500/5'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950'
              }`}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggle(dept.id)}
                className={`text-xs font-semibold text-left truncate ${
                  selected
                    ? 'text-sky-800 dark:text-sky-300'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {dept.name}
              </button>
              {selected && (
                <select
                  value={permission}
                  disabled={disabled}
                  onChange={(e) =>
                    setPermission(dept.id, e.target.value as GrantPermission)
                  }
                  className="shrink-0 px-2 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
                >
                  <option value="view">{labels.view}</option>
                  <option value="edit">{labels.edit}</option>
                </select>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type CustomRoleGrantEditorProps = {
  roles: NamedItem[];
  grants: CustomRoleGrant[];
  onChange: (grants: CustomRoleGrant[]) => void;
  disabled?: boolean;
  labels: {
    title: string;
    desc: string;
    empty: string;
    view: string;
    edit: string;
  };
};

export function CustomRoleGrantEditor({
  roles,
  grants,
  onChange,
  disabled,
  labels,
}: CustomRoleGrantEditorProps) {
  const grantMap = new Map(
    grants.map((g) => [g.custom_role_id, g.permission])
  );

  const toggle = (roleId: string) => {
    if (grantMap.has(roleId)) {
      onChange(grants.filter((g) => g.custom_role_id !== roleId));
      return;
    }
    onChange([...grants, { custom_role_id: roleId, permission: 'view' }]);
  };

  const setPermission = (roleId: string, permission: GrantPermission) => {
    onChange(
      grants.map((g) =>
        g.custom_role_id === roleId ? { ...g, permission } : g
      )
    );
  };

  if (roles.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 pt-1 border-t border-zinc-200/80 dark:border-zinc-800">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-zinc-500" />
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          {labels.title}
        </p>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{labels.desc}</p>
      <div className="space-y-2">
        {roles.map((role) => {
          const selected = grantMap.has(role.id);
          const permission = grantMap.get(role.id) || 'view';
          return (
            <div
              key={role.id}
              className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${
                selected
                  ? 'border-violet-200 dark:border-violet-500/30 bg-violet-50/50 dark:bg-violet-500/5'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950'
              }`}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggle(role.id)}
                className={`text-xs font-semibold text-left truncate ${
                  selected
                    ? 'text-violet-800 dark:text-violet-300'
                    : 'text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {role.name}
              </button>
              {selected && (
                <select
                  value={permission}
                  disabled={disabled}
                  onChange={(e) =>
                    setPermission(role.id, e.target.value as GrantPermission)
                  }
                  className="shrink-0 px-2 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700"
                >
                  <option value="view">{labels.view}</option>
                  <option value="edit">{labels.edit}</option>
                </select>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
