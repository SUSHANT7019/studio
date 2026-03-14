
'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Round {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

export function RoundsTable({ rounds }: { rounds: Round[] }) {
  const getStatus = (start: Date, end: Date) => {
    const now = new Date();
    if (now < start) return { label: "Upcoming", variant: "secondary" as const };
    if (now > end) return { label: "Finished", variant: "destructive" as const };
    return { label: "Active Now", variant: "default" as const };
  };

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-secondary/30">
          <TableRow>
            <TableHead className="font-bold">Round Name</TableHead>
            <TableHead className="font-bold">Start Time</TableHead>
            <TableHead className="font-bold">End Time</TableHead>
            <TableHead className="font-bold">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rounds.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                <p>No active rounds configured.</p>
                <p className="text-xs">Click "Add Round" to create your first gameweek.</p>
              </TableCell>
            </TableRow>
          ) : (
            rounds.map((round) => {
              const status = getStatus(round.startDate, round.endDate);
              return (
                <TableRow key={round.id} className="hover:bg-primary/5 transition-colors">
                  <TableCell className="font-bold text-foreground">{round.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(round.startDate, "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(round.endDate, "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant} className="px-3">
                      {status.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })
          )}
