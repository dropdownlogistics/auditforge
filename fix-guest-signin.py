content = open('src/app/landing/page.jsx', 'r', encoding='utf-8').read()

# Add useSignIn import
content = content.replace(
    'import { useRouter } from "next/navigation";',
    'import { useRouter } from "next/navigation";\nimport { useSignIn } from "@clerk/nextjs";'
)

# Add signIn hook inside component
content = content.replace(
    '  const [visible, setVisible] = useState(false);',
    '  const [visible, setVisible] = useState(false);\n  const [guestLoading, setGuestLoading] = useState(false);\n  const { signIn, setActive } = useSignIn();'
)

# Add guest handler
content = content.replace(
    '  useEffect(() => { setTimeout(() => setVisible(true), 200); }, []);',
    '''  useEffect(() => { setTimeout(() => setVisible(true), 200); }, []);

  async function handleGuest(e) {
    e.preventDefault();
    if (!signIn) return;
    setGuestLoading(true);
    try {
      const result = await signIn.create({
        identifier: "demo@auditforge.dev",
        password: "DDLogistics!9*6",
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/");
      }
    } catch (err) {
      console.error("Guest sign in failed:", err);
    } finally {
      setGuestLoading(false);
    }
  }'''
)

# Wire guest button to handler
content = content.replace(
    '<a href="/api/auth/demo" className="btn-guest">Enter as Guest →</a>',
    '<a href="#" className="btn-guest" onClick={handleGuest}>{guestLoading ? "Signing in..." : "Enter as Guest →"}</a>'
)

open('src/app/landing/page.jsx', 'w', encoding='utf-8').write(content)
print('done:', 'handleGuest' in content)
