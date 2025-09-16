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
  private eventListeners: Array<(event: MessageEvent) => void> = [];

  constructor(options: WorkerPoolOptions = { maxWorkers: 2, timeout: 30000 }) {
    this.options = options;
    this.initializeWorkers();
  }

  private initializeWorkers() {
    try {
      for (let i = 0; i < this.options.maxWorkers; i++) {
        console.log(`Creating worker ${i + 1}/${this.options.maxWorkers}`);
        const worker = new Worker(
          new URL('../workers/unified-analysis.worker.ts', import.meta.url)
        );
        
        // Add error handling for worker creation
        worker.onerror = (error) => {
          console.error(`Worker ${i + 1} error:`, error);
        };
        
        worker.onmessageerror = (error) => {
          console.error(`Worker ${i + 1} message error:`, error);
        };
        
        this.workers.push(worker);
        this.availableWorkers.push(worker);
        console.log(`Worker ${i + 1} created successfully`);
      }
      console.log(`Worker pool initialized with ${this.workers.length} workers`);
    } catch (error) {
      console.error('Failed to initialize worker pool:', error);
      throw error;
    }
  }

  async processMessage(message: WorkerMessage): Promise<any> {
    console.log('WorkerPool processing message:', message.type);
    console.log('WorkerPool stats:', this.getStats());
    
    return new Promise((resolve, reject) => {
      const task = { resolve, reject, message };
      
      if (this.availableWorkers.length > 0) {
        console.log('Executing task immediately with available worker');
        this.executeTask(task);
      } else {
        console.log('No available workers, queuing task');
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
    
    console.log('Executing task with worker, message:', task.message);

    const timeoutId = setTimeout(() => {
      console.error('Worker timeout after', this.options.timeout, 'ms');
      this.cleanupWorker(worker);
      task.reject(new Error('Worker timeout'));
    }, this.options.timeout);

    const onMessage = (event: MessageEvent<WorkerResponse>) => {
      console.log('Worker response received:', event.data.type);
      
      const { type, data } = event.data;
      
      if (type === 'SWING_ANALYZED') {
        console.log('Swing analysis completed successfully');
        clearTimeout(timeoutId);
        worker.removeEventListener('message', onMessage);
        this.cleanupWorker(worker);
        task.resolve(data);
      } else if (type === 'ERROR') {
        console.error('Worker error:', data?.error);
        clearTimeout(timeoutId);
        worker.removeEventListener('message', onMessage);
        this.cleanupWorker(worker);
        task.reject(new Error(data?.error || 'Worker error'));
      } else if (type === 'PROGRESS') {
        console.log('Worker progress:', data);
        // Progress updates are handled by the main thread
        // This is just to keep the worker alive - don't clean up yet
      }
    };

    worker.addEventListener('message', onMessage);
    worker.postMessage(task.message);
    console.log('Message sent to worker');
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

  addEventListener(listener: (event: MessageEvent) => void) {
    this.eventListeners.push(listener);
    // Forward messages from all workers to listeners
    this.workers.forEach(worker => {
      worker.addEventListener('message', listener);
    });
  }

  removeEventListener(listener: (event: MessageEvent) => void) {
    this.eventListeners = this.eventListeners.filter(l => l !== listener);
    this.workers.forEach(worker => {
      worker.removeEventListener('message', listener);
    });
  }

  destroy() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
    this.busyWorkers.clear();
    this.pendingTasks = [];
    this.eventListeners = [];
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

// Add event listener support
export const addWorkerPoolEventListener = (listener: (event: MessageEvent) => void) => {
  if (workerPoolInstance) {
    workerPoolInstance.addEventListener(listener);
  }
};

export const removeWorkerPoolEventListener = (listener: (event: MessageEvent) => void) => {
  if (workerPoolInstance) {
    workerPoolInstance.removeEventListener(listener);
  }
};
