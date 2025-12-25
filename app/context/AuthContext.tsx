'use client'
import { useContext, createContext, useEffect, useState, ReactNode} from "react";
import { AuthServices } from "@/lib/authServices";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

// Shape of context
interface AuthContextType {
    isLoggedIn: boolean;
    chatMode: string;
    setChatMode: (mode: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const auth = new AuthServices();

// Provider node
interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [chatMode, setChatModeState] = useState("new chat"); // new chat, recents, chat, quiz, flashcards, resume
    const [isInitialized, setIsInitialized] = useState(false);

    // Recover mode on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedMode = localStorage.getItem("chatMode");
            if (savedMode) {
                setChatModeState(savedMode);
            }
        };
        setIsInitialized(true);
    }, [])

    const setChatMode = (mode: string) => {
        setChatModeState(mode);
        if (typeof window !== "undefined") {
            localStorage.setItem("chatMode", mode)
        }
    }

    useEffect(() => {

        // listen to login/logout
        const supabase = auth.client;

        const { data } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
            console.log(event, session)

            if (event === 'INITIAL_SESSION') {
                setIsLoggedIn(session ? true: false);
            } else if (event === 'SIGNED_IN') {
                setIsLoggedIn(true);
            } else if (event === 'SIGNED_OUT') {
                setIsLoggedIn(false);
            } else if (event === 'PASSWORD_RECOVERY') {
                // handle password recovery event
            } else if (event === 'TOKEN_REFRESHED') {
                // handle token refreshed event
            } else if (event === 'USER_UPDATED') {
                // handle user updated event
            }
            })

            // call unsubscribe to remove the callback
            return () => {
                data.subscription.unsubscribe()
            };

        }, []);

        // Prevents rendering children until we know the correct chatMode
        if (!isInitialized)
            return null;

    return (
        <AuthContext.Provider value={{ isLoggedIn, chatMode, setChatMode }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook for using useContext
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

