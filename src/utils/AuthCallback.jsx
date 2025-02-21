import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const { error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error en autenticación:", error);
      } else {
        navigate("/home");
      }
    };
    handleAuth();
  }, []);

  return <p>Redirigiendo...</p>;
};

export default AuthCallback;
