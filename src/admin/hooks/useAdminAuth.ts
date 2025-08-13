import { useAdminAuth as useAdminAuthContext } from '../context/AdminAuthContext';

/**
 * Hook to access the admin authentication context
 * Re-exports the useAdminAuth hook from AdminAuthContext for import consistency
 */
export const useAdminAuth = useAdminAuthContext;

export default useAdminAuth;
