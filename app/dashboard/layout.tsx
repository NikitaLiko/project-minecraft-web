import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { MaintenanceLogoutButton } from '@/components/ui/maintenance-logout-button';
import { getJwtSecret } from '@/lib/jwt';

async function getUserRole(token: string) {
    try {
        const decoded = jwt.verify(token, getJwtSecret()) as any;
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { role: true }
        });
        return user?.role || 'USER';
    } catch {
        return 'USER';
    }
}

async function getSystemConfig() {
    try {
        const config = await prisma.systemConfig.findUnique({
            where: { id: 'config' }
        });
        return config || { maintenanceMode: false };
    } catch {
        return { maintenanceMode: false };
    }
}

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        redirect('/login');
    }

    const [config, role] = await Promise.all([
        getSystemConfig(),
        getUserRole(token)
    ]);

    if (config.maintenanceMode && role !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
                <div className="max-w-md space-y-8">
                    <div className="w-24 h-24 mx-auto border-4 border-yellow-500/50 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-4xl">⚠️</span>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-2xl font-black font-display tracking-[0.2em] text-yellow-500 uppercase">
                            SYSTEM MAINTENANCE
                        </h1>
                        <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                            The system is currently undergoing critical updates. Access is restricted to administrative personnel only.
                            <br /><br />
                            Please try again later.
                        </p>
                    </div>

                    <div className="pt-8 border-t border-primary/20">
                        <MaintenanceLogoutButton />
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
