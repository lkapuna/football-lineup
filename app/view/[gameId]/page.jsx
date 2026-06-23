import PublicView from "@/components/PublicView";

export default async function PublicGamePage({ params }) {
  const { gameId } = await params;
  return <PublicView gameId={gameId} />;
}
