'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WebhooksManager } from '@/components/dashboard/integrations/webhooks-manager'
import { UtmfyManager } from '@/components/dashboard/integrations/utmfy-manager'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plug } from 'lucide-react'

export default function IntegrationsPage() {
    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Integrações"
                text="Conecte sua conta com ferramentas externas de marketing e automação."
            >
            </DashboardHeader>

            <Tabs defaultValue="webhooks" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
                    <TabsTrigger value="tracking">Tracking (UTMify)</TabsTrigger>
                    {/* <TabsTrigger value="pixels">Pixels</TabsTrigger> */}
                </TabsList>

                <TabsContent value="webhooks">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Plug className="w-5 h-5 text-primary" />
                                <CardTitle>Webhooks</CardTitle>
                            </div>
                            <CardDescription>
                                Envie dados de vendas em tempo real para automações como n8n, Zapier ou ActiveCampaign.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <WebhooksManager />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="tracking">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <CardTitle>Rastreamento Avançado</CardTitle>
                            </div>
                            <CardDescription>
                                Integrações nativas com ferramentas de LTV e atribuição.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UtmfyManager />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
