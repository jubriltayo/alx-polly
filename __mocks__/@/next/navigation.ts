export const useRouter = () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  });
  
  export const usePathname = () => '';
  
  export const useSearchParams = () => ({
    get: jest.fn(),
  });
  
  export const redirect = jest.fn();