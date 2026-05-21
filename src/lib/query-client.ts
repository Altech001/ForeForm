import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 1000 * 60 * 2,
            gcTime: 1000 * 60 * 30,
        },
    },
});
