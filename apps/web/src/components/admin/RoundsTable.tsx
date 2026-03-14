
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

interface Round {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

export function RoundsTable({ rounds }: { rounds: Round[] }) {
  const getStatus = (start: Date, end: Date) => {
    const now = new Date();
    if (now < new Date(start)) return "Upcoming";
    if (now > new Date(end)) return "Finished";
    return "Active";
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rounds.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                No rounds created yet.
              </TableCell>
            </TableRow>
          ) : (
            rounds.map((round) => (
              <TableRow key={round.id}>
                <TableCell className="font-medium">{round.name}</TableCell>
                <TableCell>{new Date(round.startDate).toLocaleString()}</TableCell>
                <TableCell>{new Date(round.endDate).toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={getStatus(round.startDate, round.endDate) === "Active" ? "default" : "secondary"}>
                    {getStatus(round.startDate, round.endDate)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
