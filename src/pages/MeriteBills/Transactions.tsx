import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/billapi";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeftRight } from "lucide-react";
import { format } from "date-fns";

export default function Transactions() {
    const { data: transactions, isLoading } = useQuery({
        queryKey: ["transactions"],
        queryFn: api.transactions.list,
    });

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 min-h-screen">
            <div>
                <h1 className="text-2xl md:text-xl font-semibold tracking-tight">Transactions</h1>
                <p className="text-muted-foreground mt-1 text-sm">All purchase transactions</p>
            </div>

            <Card className="border-0 shadow-sm overflow-hidden rounded-none">
                {isLoading ? (
                    <div className="p-6 space-y-3">
                        {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                ) : transactions?.length === 0 ? (
                    <div className="p-12 text-center">
                        <ArrowLeftRight className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                        <p className="text-muted-foreground">No transactions yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>ID</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Tax</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions?.map((tx) => (
                                    <TableRow key={tx.id} className="hover:bg-muted/30">
                                        <TableCell className="font-mono text-sm">#{tx.id}</TableCell>
                                        <TableCell className="text-sm font-medium">{tx.phone_number}</TableCell>
                                        <TableCell className="text-sm">{tx.amount} DA</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{tx.tax} DA</TableCell>
                                        <TableCell className="text-sm font-semibold">{tx.total_price} DA</TableCell>
                                        <TableCell>
                                            <Badge variant={tx.status === "completed" ? "default" : "secondary"} className="text-xs">
                                                {tx.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {tx.transaction_date ? format(new Date(tx.transaction_date), "MMM d, yyyy HH:mm") : "—"}
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