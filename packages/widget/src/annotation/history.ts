import type { Annotation } from '../types';

const MAX_HISTORY = 50;

export class AnnotationHistory {
  private past: Annotation[][] = [];
  private future: Annotation[][] = [];
  private current: Annotation[] = [];

  getCurrent(): Annotation[] {
    return [...this.current];
  }

  push(annotations: Annotation[]): void {
    this.past.push([...this.current]);
    if (this.past.length > MAX_HISTORY) {
      this.past.shift();
    }
    this.current = [...annotations];
    this.future = [];
  }

  undo(): Annotation[] | null {
    if (this.past.length === 0) return null;
    this.future.push([...this.current]);
    this.current = this.past.pop()!;
    return [...this.current];
  }

  redo(): Annotation[] | null {
    if (this.future.length === 0) return null;
    this.past.push([...this.current]);
    this.current = this.future.pop()!;
    return [...this.current];
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  clear(): void {
    this.past = [];
    this.future = [];
    this.current = [];
  }
}
