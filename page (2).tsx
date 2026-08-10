'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
const C = { bg:'#15171C',surface:'#1F232B',border:'#323844',text:'#EDEFF2',muted:'#8B92A3',xp:'#7CFF6B',error:'#FF6B5C' };
export default function LoginPage() {
  const router = useRouter();
  const [email,setEmail]=useState('');const [password,setPassword]=useState('');
  const [error,setError]=useState<string|null>(null);const [loading,setLoading]=useState(false);
  const handleLogin=async(e:React.FormEvent)=>{
    e.preventDefault();setError(null);setLoading(true);
    const supabase=createClient();
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error){setError(error.message);setLoading(false);return;}
    router.push('/');router.refresh();
  };
  return(
    <div className="flex min-h-screen flex-col items-center justify-center px-6" style={{backgroundColor:C.bg,color:C.text,fontFamily:"'Inter',sans-serif"}}>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold" style={{fontFamily:"'Space Grotesk',sans-serif"}}>Welcome back</h1>
          <p className="mt-2 text-sm" style={{color:C.muted}}>Log in to continue your training quest.</p>
        </div>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {[{label:'Email',value:email,set:setEmail,type:'email',placeholder:'you@example.com'},{label:'Password',value:password,set:setPassword,type:'password',placeholder:'••••••••'}].map(({label,value,set,type,placeholder})=>(
            <div key={label}>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider" style={{color:C.muted}}>{label}</label>
              <input type={type} required value={value} onChange={e=>set(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                style={{borderColor:C.border,backgroundColor:C.surface,color:C.text}} placeholder={placeholder}/>
            </div>
          ))}
          {error&&<p className="text-sm" style={{color:C.error}}>{error}</p>}
          <button type="submit" disabled={loading} className="mt-2 w-full rounded-2xl py-4 text-lg font-bold disabled:opacity-60"
            style={{backgroundColor:C.xp,color:'#0E150C',fontFamily:"'Space Grotesk',sans-serif"}}>
            {loading?'Logging in…':'Log In'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm" style={{color:C.muted}}>New here? <a href="/signup" className="font-semibold" style={{color:C.xp}}>Create an account</a></p>
      </div>
    </div>
  );
}
