import { supabase } from '../utils/supabaseClient'

export default function Auth() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => authListener?.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (error) console.error(error)
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error(error)
  }

  return (
    <div>
      {user ? (
        <div>
          <p>Bienvenido, {user.email}</p>
          <button onClick={signOut}>Cerrar sesión</button>
        </div>
      ) : (
        <button onClick={signInWithGoogle}>Ingresar con Google</button>
      )}
    </div>
  )
}