import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KpiCardProps {
    title: string
    value: string | number
    description?: string
    icon: React.ElementType
    trend?: number
    className?: string
}

export function KpiCard({ title, value, description, icon: Icon, trend, className }: KpiCardProps) {
    return (
        <Card className={cn("hover:shadow-md transition-shadow", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {(description || trend !== undefined) && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        {trend !== undefined && (
                            <span className={cn(
                                "font-medium",
                                trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-500"
                            )}>
                                {trend > 0 ? '+' : ''}{trend}%
                            </span>
                        )}
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
