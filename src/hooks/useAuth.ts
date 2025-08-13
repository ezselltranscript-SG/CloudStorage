import { useAuth as useAuthContext } from '../contexts/AuthContext';

/**
 * Hook para acceder al contexto de autenticación
 * Re-exporta el hook useAuth del AuthContext para mantener la consistencia de imports
 */
export const useAuth = useAuthContext;

export default useAuth;
