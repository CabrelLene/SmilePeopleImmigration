import { createContext, useContext, useState } from "react";
import { api, setToken } from "../api";
import type { User } from "../types";

type Ctx = { user: User|null; login:(e:string,p:string)=>Promise<void>; register:(d:any)=>Promise<void>; logout:()=>void };
const AuthCtx = createContext<Ctx>(null as any);

export function AuthProvider({children}:{children:React.ReactNode}) {
  const [user,setUser] = useState<User|null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const login = async (email:string,password:string) => {
    const {token,user} = await api.login({email,password});
    setToken(token); setUser(user); localStorage.setItem("user", JSON.stringify(user));
  };
  const register = async (d:any) => {
    const {token,user} = await api.register(d);
    setToken(token); setUser(user); localStorage.setItem("user", JSON.stringify(user));
  };
  const logout = () => { setToken(null); setUser(null); localStorage.removeItem("user"); };
  return <AuthCtx.Provider value={{user,login,register,logout}}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);
