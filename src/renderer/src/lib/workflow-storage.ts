import type { Node, Edge } from "@xyflow/react";

export interface WorkflowData {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: Date;
  updatedAt: Date;
}

export class WorkflowStorage {
  private static readonly STORAGE_KEY = "ui-automation-workflows";

  static saveWorkflow(
    workflow: Omit<WorkflowData, "id" | "createdAt" | "updatedAt">,
  ): WorkflowData {
    const workflows = this.getAllWorkflows();
    const now = new Date();

    const newWorkflow: WorkflowData = {
      ...workflow,
      id: `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    workflows.push(newWorkflow);
    this.saveToStorage(workflows);

    return newWorkflow;
  }

  static updateWorkflow(
    id: string,
    updates: Partial<Omit<WorkflowData, "id" | "createdAt">>,
  ): WorkflowData | null {
    const workflows = this.getAllWorkflows();
    const index = workflows.findIndex((w) => w.id === id);

    if (index === -1) return null;

    workflows[index] = {
      ...workflows[index],
      ...updates,
      updatedAt: new Date(),
    };

    this.saveToStorage(workflows);
    return workflows[index];
  }

  static deleteWorkflow(id: string): boolean {
    const workflows = this.getAllWorkflows();
    const filteredWorkflows = workflows.filter((w) => w.id !== id);

    if (filteredWorkflows.length === workflows.length) return false;

    this.saveToStorage(filteredWorkflows);
    return true;
  }

  static getWorkflow(id: string): WorkflowData | null {
    const workflows = this.getAllWorkflows();
    return workflows.find((w) => w.id === id) || null;
  }

  static getAllWorkflows(): WorkflowData[] {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const workflows = JSON.parse(stored);
      return workflows.map((w: any) => ({
        ...w,
        createdAt: new Date(w.createdAt),
        updatedAt: new Date(w.updatedAt),
      }));
    } catch {
      return [];
    }
  }

  private static saveToStorage(workflows: WorkflowData[]): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(workflows));
    } catch (error) {
      console.error("Failed to save workflows:", error);
    }
  }
}
