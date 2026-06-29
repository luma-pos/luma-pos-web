import { getInternalUseIssues } from "@/lib/data/internal-use";
import { InternalUseTable } from "./internal-use-table";

export async function InternalUseTab() {
  const rows = await getInternalUseIssues(50);

  return <InternalUseTable rows={rows} />;
}
