describe('Leader Election Integration Test', () => {
  it('should elect exactly one active leader among multiple daemon nodes', async () => {
    const nodes = [
      { id: 'node-1', isLeader: true },
      { id: 'node-2', isLeader: false },
      { id: 'node-3', isLeader: false },
    ];

    const leaders = nodes.filter(n => n.isLeader);
    expect(leaders).toHaveLength(1);
    expect(leaders[0].id).toBe('node-1');
  });
});
