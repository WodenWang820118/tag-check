export interface ProjectSpec {
  projectSlug: string;
  specs: Spec[];
}

export interface Spec {
  event: string;
  [key: string]: string;
}
