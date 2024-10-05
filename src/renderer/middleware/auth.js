import { useUserStore } from '@/renderer/store/user'

export default async function auth({ next }) {
  const authStore = useUserStore();
  const user = await authStore.checkAuth();
  console.log('middleware user ', user)
  if (!user) {
    console.log("Not logged in");
    return next({
      name: "Login",
    });
  }
  return next();
}