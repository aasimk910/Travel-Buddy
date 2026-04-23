describe('Example Service Test', () => {
  it('should demonstrate service function testing', () => {
    const mockServiceFunction = async (id) => {
      return { id, data: 'test data' };
    };

    mockServiceFunction(1).then((result) => {
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('data', 'test data');
    });
  });

  it('should test async operations', async () => {
    const fetchData = async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, data: [] });
        }, 100);
      });
    };

    const result = await fetchData();
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });
});
