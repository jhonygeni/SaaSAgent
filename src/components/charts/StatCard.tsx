
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  subtitle: string;
  changeColor?: string;
}

export function StatCard({ title, value, change, subtitle, changeColor = "text-green-500 bg-green-500/10" }: StatCardProps) {
  return (
    <Card className="bg-card dark:bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-4xl font-bold">{value}</span>
          {change && (
            <span className={`text-sm ${changeColor} px-2 py-0.5 rounded`}>{change}</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
