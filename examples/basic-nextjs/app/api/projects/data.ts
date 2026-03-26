export interface Project {
  id: string;
  name: string;
  status: string;
  budget: number;
}

export const projects: Project[] = [
  { id: "1", name: "Website Redesign", status: "active", budget: 15000 },
  { id: "2", name: "Mobile App", status: "planning", budget: 50000 },
  { id: "3", name: "API Integration", status: "completed", budget: 8000 },
];
