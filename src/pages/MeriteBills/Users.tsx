import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/billapi";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, RefreshCw, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ActiveUsers() {
    const qc = useQueryClient();

    const { data: users, isLoading } = useQuery({
        queryKey: ["activeUsers"],
        queryFn: api.activeUsers.list,
        refetchInterval: 30000,
    });

    const cleanupMutation = useMutation({
        mutationFn: api.cleanup.expireCodes,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["activeUsers"] }); toast.success("Expired codes cleaned up"); },
    });

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-xl font-semibold tracking-tight">Active Users</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Users with active subscriptions</p>
                </div>
                <Button variant="outline" onClick={() => cleanupMutation.mutate()} disabled={cleanupMutation.isPending} className="gap-2">
                    {cleanupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Cleanup Expired
                </Button>
            </div>

            <Card className="border-0 shadow-sm overflow-hidden rounded-none">
                {isLoading ? (
                    <div className="p-6 space-y-3">
                        {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                ) : users?.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                        <p className="text-muted-foreground">No active users right now</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Activated</TableHead>
                                    <TableHead>Expires</TableHead>
                                    <TableHead>Time Left</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users?.map((user, i) => (
                                    <TableRow key={i} className="hover:bg-muted/30">
                                        <TableCell className="text-sm font-medium">{user.phoneNumber}</TableCell>
                                        <TableCell className="font-mono text-sm">{user.code}</TableCell>
                                        <TableCell className="text-sm">{user.planName}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{user.duration}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {format(new Date(user.activatedAt), "MMM d, HH:mm")}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {format(new Date(user.expiresAt), "MMM d, HH:mm")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs font-medium">{user.timeLeftFormatted}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>
        </div>
    );
}