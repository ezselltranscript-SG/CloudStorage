import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase/supabase-client';

/**
 * Botón de cierre de sesión alternativo que maneja errores 403
 */
const LogoutButton = ({ className }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Intenta el cierre de sesión normal
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error al cerrar sesión:', error);
        
        // Si hay un error, limpia manualmente las cookies y el almacenamiento local
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.split('=');
          document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        });
        
        // Limpiar localStorage relacionado con Supabase
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('supabase.auth.refreshToken');
        
        // Limpiar sessionStorage relacionado con Supabase
        sessionStorage.removeItem('supabase.auth.token');
        sessionStorage.removeItem('supabase.auth.refreshToken');
      }
      
      // Redirigir a la página de inicio de sesión
      navigate('/login');
      
      // Recargar la página para asegurar que todo se reinicie
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
    } catch (err) {
      console.error('Error crítico al cerrar sesión:', err);
      // Forzar recarga y redirección en caso de error
      navigate('/login');
      window.location.reload();
    }
  };

  return (
    <button 
      onClick={handleLogout} 
      className={className || "px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"}
    >
      Cerrar sesión
    </button>
  );
};

export default LogoutButton;
