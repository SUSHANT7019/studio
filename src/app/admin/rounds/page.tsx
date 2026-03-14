import { getRounds } from "@/actions/rounds";
import { RoundsTable } from "@/components/admin/RoundsTable";
import { AddRoundDialog } from "@/components/admin/AddRoundDialog";

export default async function AdminRoundsPage() {
  const response = await getRounds();
  const rounds = response.success ? response.data : [];

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Competition Rounds</h1>
          <p className="text-muted-foreground">
            Manage gameweeks, schedule windows, and active phases.
          </p>
        </div>
        <AddRoundDialog />
      </div>
      <RoundsTable rounds={rounds} />
    </div>
  );
}