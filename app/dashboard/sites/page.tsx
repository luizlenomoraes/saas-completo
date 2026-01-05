'use client'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { SitesManager } from '@/components/dashboard/sites/sites-manager'
import { Card, CardContent } from '@/components/ui/card'

export default function SitesPage() {
    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Sites e Páginas"
                text="Clone e gerencie páginas de vendas para suas campanhas."
            />
            <Card>
                <CardContent className="pt-6">
                    <SitesManager />
                </CardContent>
            </Card>
        </div>
    )
}
