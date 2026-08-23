export function projectsList(tenantId: string): string {
  return `/dashboard/${tenantId}/projects`;
}

export function projectCanvas(tenantId: string, projectId: string): string {
  return `/dashboard/${tenantId}/projects/${projectId}`;
}

export function myTasks(tenantId: string): string {
  return `/dashboard/${tenantId}/my-tasks`;
}

export function publicShare(projectId: string): string {
  return `/share/${projectId}`;
}

export function projectCardLink(projectId: string): string {
  return `a[href*="/projects/${projectId}"]`;
}
