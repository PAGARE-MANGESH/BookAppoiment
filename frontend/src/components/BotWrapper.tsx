"use client";

import { usePathname } from "next/navigation";
import FloatingChatbot from "@/components/FloatingChatBot";

export default function BotWrapper() {
    const pathname = usePathname();
    const isLoginPage = pathname === "/";

    if (isLoginPage) return null;

    return <FloatingChatbot />;
}
