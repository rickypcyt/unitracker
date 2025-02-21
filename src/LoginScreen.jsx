import { useAuth } from "./utils/Auth";

const LoginScreen = () => {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Iniciar Sesión</h1>
        <button
          onClick={signInWithGoogle}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Iniciar sesión con Google
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
