import flagsmith from '@flagsmith/flagsmith';

export const initFlagsmith = async () => {
  try {
    await flagsmith.init({
      environmentID: 'SWD3QsYgWc5vxnHGKz4F6U',
      api: 'http://localhost:8100/api/v1/',
      cacheFlags: true,
    });
  } catch (e) {
    console.warn('Flagsmith init failed, continuing without flags', e);
  }
};

export { flagsmith };
export default flagsmith;