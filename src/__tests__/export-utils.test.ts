import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SwingExporter, ExportData, ExportOptions, defaultExportOptions } from '../lib/export-utils';
import { TrajectoryPoint, SwingTrajectory } from '../lib/mediapipe';
import { SwingPhase } from '../lib/swing-phases';
import { TrajectoryMetrics, SwingPathAnalysis } from '../lib/trajectory-analysis';
import { SwingReportCard } from '../lib/vista-swing-ai';

// Mock data for testing
const createMockTrajectory = (count: number): SwingTrajectory => {
  const rightWrist: TrajectoryPoint[] = [];
  const leftWrist: TrajectoryPoint[] = [];
  const rightShoulder: TrajectoryPoint[] = [];
  const leftShoulder: TrajectoryPoint[] = [];
  const rightHip: TrajectoryPoint[] = [];
  const leftHip: TrajectoryPoint[] = [];
  const clubhead: TrajectoryPoint[] = [];

  for (let i = 0; i < count; i++) {
    const timestamp = i * 33.33;
    const frame = i;

    rightWrist.push({
      x: 0.3 + 0.4 * Math.sin((i / count) * Math.PI),
      y: 0.7 - 0.6 * (i / count),
      z: 0.1 * Math.sin((i / count) * Math.PI * 2),
      timestamp,
      frame
    });

    leftWrist.push({
      x: 0.2 + 0.4 * Math.sin((i / count) * Math.PI),
      y: 0.7 - 0.6 * (i / count),
      z: 0.1 * Math.sin((i / count) * Math.PI * 2),
      timestamp,
      frame
    });

    rightShoulder.push({
      x: 0.4,
      y: 0.3,
      z: 0.0,
      timestamp,
      frame
    });

    leftShoulder.push({
      x: 0.6,
      y: 0.3,
      z: 0.0,
      timestamp,
      frame
    });

    rightHip.push({
      x: 0.45,
      y: 0.6,
      z: 0.0,
      timestamp,
      frame
    });

    leftHip.push({
      x: 0.55,
      y: 0.6,
      z: 0.0,
      timestamp,
      frame
    });

    clubhead.push({
      x: 0.3 + 0.4 * Math.sin((i / count) * Math.PI) + 0.1,
      y: 0.7 - 0.6 * (i / count) - 0.05,
      z: 0.1 * Math.sin((i / count) * Math.PI * 2),
      timestamp,
      frame
    });
  }

  return {
    rightWrist,
    leftWrist,
    rightShoulder,
    leftShoulder,
    rightHip,
    leftHip,
    clubhead
  };
};

const createMockPhases = (): SwingPhase[] => [
  {
    name: 'Setup',
    startFrame: 0,
    endFrame: 5,
    startTime: 0,
    endTime: 166.65,
    duration: 166.65,
    keyLandmarks: [],
    color: '#3B82F6',
    description: 'Initial position'
  },
  {
    name: 'Backswing',
    startFrame: 5,
    endFrame: 35,
    startTime: 166.65,
    endTime: 1166.55,
    duration: 999.9,
    keyLandmarks: [],
    color: '#10B981',
    description: 'Takeaway to top'
  },
  {
    name: 'Transition',
    startFrame: 35,
    endFrame: 45,
    startTime: 1166.55,
    endTime: 1499.85,
    duration: 333.3,
    keyLandmarks: [],
    color: '#F59E0B',
    description: 'Downswing to impact'
  },
  {
    name: 'Impact',
    startFrame: 45,
    endFrame: 47,
    startTime: 1499.85,
    endTime: 1566.51,
    duration: 66.66,
    keyLandmarks: [],
    color: '#EF4444',
    description: 'Ball contact'
  },
  {
    name: 'Follow-through',
    startFrame: 47,
    endFrame: 59,
    startTime: 1566.51,
    endTime: 1966.47,
    duration: 399.96,
    keyLandmarks: [],
    color: '#8B5CF6',
    description: 'Finish position'
  }
];

const createMockMetrics = (): TrajectoryMetrics => ({
  totalDistance: 2.5,
  maxVelocity: 3.2,
  avgVelocity: 1.8,
  maxAcceleration: 5.1,
  avgAcceleration: 2.3,
  peakFrame: 30,
  smoothness: 0.85
});

const createMockPathAnalysis = (): SwingPathAnalysis => ({
  clubheadPath: [],
  swingPlane: 12.5,
  pathConsistency: 0.78,
  insideOut: true,
  outsideIn: false,
  onPlane: false
});

const createMockReportCard = (): SwingReportCard => ({
  setup: { grade: 'A', tip: 'Excellent setup' },
  grip: { grade: 'B', tip: 'Good grip' },
  alignment: { grade: 'A', tip: 'Perfect alignment' },
  rotation: { grade: 'B', tip: 'Good rotation' },
  impact: { grade: 'A', tip: 'Great impact' },
  followThrough: { grade: 'B', tip: 'Good finish' },
  overall: { score: 'A-', tip: 'Excellent swing overall' }
});

describe('SwingExporter', () => {
  let exportData: ExportData;
  let exportOptions: ExportOptions;

  beforeEach(() => {
    exportData = {
      swingId: 'test-swing-123',
      timestamp: Date.now(),
      club: 'driver',
      trajectory: createMockTrajectory(60),
      phases: createMockPhases(),
      metrics: createMockMetrics(),
      pathAnalysis: createMockPathAnalysis(),
      reportCard: createMockReportCard(),
      videoUrl: 'https://example.com/video.mp4'
    };

    exportOptions = { ...defaultExportOptions };
  });

  describe('exportAsJSON', () => {
    it('should export basic data when all options are false', () => {
      exportOptions.includeTrajectory = false;
      exportOptions.includePhases = false;
      exportOptions.includeMetrics = false;
      exportOptions.includeReportCard = false;

      const result = SwingExporter.exportAsJSON(exportData, exportOptions);
      const parsed = JSON.parse(result);

      expect(parsed.swingId).toBe(exportData.swingId);
      expect(parsed.timestamp).toBe(exportData.timestamp);
      expect(parsed.club).toBe(exportData.club);
      expect(parsed.videoUrl).toBe(exportData.videoUrl);
      expect(parsed.trajectory).toBeUndefined();
      expect(parsed.phases).toBeUndefined();
      expect(parsed.metrics).toBeUndefined();
      expect(parsed.reportCard).toBeUndefined();
    });

    it('should export all data when all options are true', () => {
      const result = SwingExporter.exportAsJSON(exportData, exportOptions);
      const parsed = JSON.parse(result);

      expect(parsed.swingId).toBe(exportData.swingId);
      expect(parsed.timestamp).toBe(exportData.timestamp);
      expect(parsed.club).toBe(exportData.club);
      expect(parsed.videoUrl).toBe(exportData.videoUrl);
      expect(parsed.trajectory).toBeDefined();
      expect(parsed.phases).toBeDefined();
      expect(parsed.metrics).toBeDefined();
      expect(parsed.pathAnalysis).toBeDefined();
      expect(parsed.reportCard).toBeDefined();
    });

    it('should export valid JSON', () => {
      const result = SwingExporter.exportAsJSON(exportData, exportOptions);
      
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe('exportAsCSV', () => {
    it('should export CSV with basic trajectory data', () => {
      exportOptions.includePhases = false;
      exportOptions.includeMetrics = false;

      const result = SwingExporter.exportAsCSV(exportData, exportOptions);
      const lines = result.split('\n');

      // Check header
      expect(lines[0]).toContain('Frame,Timestamp,RightWrist_X,RightWrist_Y,RightWrist_Z');
      expect(lines[0]).not.toContain('Phase');
      expect(lines[0]).not.toContain('Velocity');

      // Check data rows
      expect(lines.length).toBe(exportData.trajectory.rightWrist.length + 1); // +1 for header
      
      // Check first data row
      const firstDataRow = lines[1].split(',');
      expect(firstDataRow[0]).toBe('0'); // Frame
      expect(firstDataRow[1]).toBe('0'); // Timestamp
    });

    it('should export CSV with phases when enabled', () => {
      exportOptions.includePhases = true;
      exportOptions.includeMetrics = false;

      const result = SwingExporter.exportAsCSV(exportData, exportOptions);
      const lines = result.split('\n');

      expect(lines[0]).toContain('Phase,PhaseProgress');
    });

    it('should export CSV with metrics when enabled', () => {
      exportOptions.includePhases = false;
      exportOptions.includeMetrics = true;

      const result = SwingExporter.exportAsCSV(exportData, exportOptions);
      const lines = result.split('\n');

      expect(lines[0]).toContain('Velocity,Acceleration');
    });

    it('should export CSV with all data when all options enabled', () => {
      const result = SwingExporter.exportAsCSV(exportData, exportOptions);
      const lines = result.split('\n');

      expect(lines[0]).toContain('Frame,Timestamp,RightWrist_X,RightWrist_Y,RightWrist_Z,Phase,PhaseProgress,Velocity,Acceleration');
    });
  });

  describe('downloadFile', () => {
    it('should create download link for string content', () => {
      const content = 'test content';
      const filename = 'test.txt';
      const mimeType = 'text/plain';

      // Mock DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };
      
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      SwingExporter.downloadFile(content, filename, mimeType);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe(filename);
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(mockLink.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test-url');

      // Cleanup
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });

    it('should create download link for Blob content', () => {
      const content = new Blob(['test'], { type: 'text/plain' });
      const filename = 'test.txt';
      const mimeType = 'text/plain';

      // Mock DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };
      
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      SwingExporter.downloadFile(content, filename, mimeType);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe(filename);
      expect(createObjectURLSpy).toHaveBeenCalledWith(content);
      expect(mockLink.click).toHaveBeenCalled();

      // Cleanup
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });
  });

  describe('defaultExportOptions', () => {
    it('should have correct default values', () => {
      expect(defaultExportOptions.format).toBe('json');
      expect(defaultExportOptions.includeTrajectory).toBe(true);
      expect(defaultExportOptions.includePhases).toBe(true);
      expect(defaultExportOptions.includeMetrics).toBe(true);
      expect(defaultExportOptions.includeReportCard).toBe(true);
      expect(defaultExportOptions.videoQuality).toBe('medium');
      expect(defaultExportOptions.frameRate).toBe(30);
    });
  });
});
