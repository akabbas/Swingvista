'use client';

import type { WorkerMessage, WorkerResponse } from '../workers/unified-analysis.worker';

export interface WorkerPoolOptions {
  maxWorkers: number;
  timeout: number;
}

export class WorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private busyWorkers: Set<Worker> = new Set();
  private pendingTasks: Array<{
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    message: WorkerMessage;
  }> = [];
  private options: WorkerPoolOptions;

  constructor(options: WorkerPoolOptions = { maxWorkers: 2, timeout: 30000 }) {
    this.options = options;
    this.initializeWorkers();
  }

  private initializeWorkers() {
    for (let i = 0; i < this.options.maxWorkers; i++) {
      const worker = new Worker(
        new URL('../workers/unified-analysis.worker.ts', import.meta.url)
      );
      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
  }

  async processMessage(message: WorkerMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      const task = { resolve, reject, message };
      
      if (this.availableWorkers.length > 0) {
        this.executeTask(task);
      } else {
        this.pendingTasks.push(task);
      }
    });
  }

  private executeTask(task: {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    message: WorkerMessage;
  }) {
    const worker = this.availableWorkers.pop()!;
    this.busyWorkers.add(worker);

    const timeoutId = setTimeout(() => {
      this.cleanupWorker(worker);
      task.reject(new Error('Worker timeout'));
    }, this.options.timeout);

    const onMessage = (event: MessageEvent<WorkerResponse>) => {
      clearTimeout(timeoutId);
      worker.removeEventListener('message', onMessage);
      this.cleanupWorker(worker);
      
      const { type, data } = event.data;
      
      if (type === 'SWING_ANALYZED') {
        task.resolve(data);
      } else if (type === 'ERROR') {
        task.reject(new Error(data?.error || 'Worker error'));
      } else if (type === 'PROGRESS') {
        // Progress updates are handled by the main thread
        // This is just to keep the worker alive
      }
    };

    worker.addEventListener('message', onMessage);
    worker.postMessage(task.message);
  }

  private cleanupWorker(worker: Worker) {
    this.busyWorkers.delete(worker);
    this.availableWorkers.push(worker);
    
    // Process next pending task
    if (this.pendingTasks.length > 0) {
      const nextTask = this.pendingTasks.shift()!;
      this.executeTask(nextTask);
    }
  }

  getStats() {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      busyWorkers: this.busyWorkers.size,
      pendingTasks: this.pendingTasks.length
    };
  }

  destroy() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
    this.busyWorkers.clear();
    this.pendingTasks = [];
  }
}

// Singleton worker pool instance
let workerPoolInstance: WorkerPool | null = null;

export const getWorkerPool = (): WorkerPool => {
  if (!workerPoolInstance) {
    workerPoolInstance = new WorkerPool();
  }
  return workerPoolInstance;
};

export const destroyWorkerPool = () => {
  if (workerPoolInstance) {
    workerPoolInstance.destroy();
    workerPoolInstance = null;
  }
};
