jest.mock('debounce', () => {
  return {
    __esModule: true,
    default: (fn) => {
      fn.cancel = () => {};
      fn.flush = () => {};

      return fn;
    },
  };
});
