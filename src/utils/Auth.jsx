import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient"; // Asegúrate de importar tu cliente de Supabase
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Escucha los cambios en el estado de autenticación
    const { data: { session } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        navigate("/home"); // Redirigir después del login
      }
    });

    // Si ya hay una sesión, actualiza el usuario
    if (session?.user) {
      setUser(session.user);
      navigate("/home"); // Redirigir si ya está logueado
    }

    return () => {
      // Limpieza de la suscripción
      supabase.auth.offAuthStateChange();
    };
  }, [navigate]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/home`, // Redirigir a home después del login
      },
    });

    if (error) console.error("Error en Google Sign-In:", error);
  };

  return (
    <AuthContext.Provider value={{ user, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
