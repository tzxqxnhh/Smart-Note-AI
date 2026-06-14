import { describe, it, expect } from 'vitest';

describe('项目烟雾测试', () => {
  it('Vitest 应该能正常运行', () => {
    expect(1 + 1).toBe(2);
  });

  it('应该能使用 Node.js 环境', () => {
    expect(typeof process).toBe('object');
    expect(process.env.NODE_ENV).toBeDefined();
  });
});
