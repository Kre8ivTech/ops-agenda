import { getChatGPTUser } from "./chatgpt-auth";
import { OpsAgendaDashboard } from "./workspace";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();

  return <OpsAgendaDashboard user={user} />;
}
