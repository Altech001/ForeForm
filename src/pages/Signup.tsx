import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { useAuth } from '@/lib/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Signup() {
    const { registerUser, googleLoginUser } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await registerUser(email, name, password);
            toast.success('Account created! Please log in.');
            navigate('/login');
        } catch (err: any) {
            toast.error(err.message || 'Failed to register account');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50/0 p-4">
            <SEO title="Sign Up" path="/signup" />
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded shadow-sm border border-slate-100">
                <div className="text-center">
                    <div className="mx-auto w-12 h-12 *:text-primary rounded-xl flex items-center justify-center mb-4">
                        <img src="/letter-m.png" alt="Logo" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create an account</h2>
                    <p className="text-sm text-slate-500 mt-2">Start building powerful forms today</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                placeholder="Jane Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-11" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Sign Up
                    </Button>
                </form>

                <div className="mt-6 flex items-center justify-center">
                    <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                            if (credentialResponse.credential) {
                                setIsLoading(true);
                                try {
                                    await googleLoginUser(credentialResponse.credential);
                                    navigate('/');
                                } catch (err: any) {
                                    toast.error(err.message || 'Google Login failed');
                                } finally {
                                    setIsLoading(false);
                                }
                            }
                        }}
                        onError={() => {
                            toast.error('Google Login failed');
                        }}
                    />
                </div>

                <p className="text-center text-sm text-slate-600 mt-6 md:mt-8">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary hover:underline font-medium">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
