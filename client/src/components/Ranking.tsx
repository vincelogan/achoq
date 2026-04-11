import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const users = [
  { name: "@usuario1", votes: 124, rank: 1 },
  { name: "@usuario2", votes: 98, rank: 2 },
  { name: "@usuario3", votes: 87, rank: 3 },
  { name: "@usuario4", votes: 76, rank: 4 },
  { name: "@usuario5", votes: 65, rank: 5 },
];

export default function Ranking() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Participações mais ativas
          </h2>
          <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Quem está mais engajado na construção da expectativa coletiva.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {users.map((user) => (
            <Card key={user.rank} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-500">
                  #{user.rank}
                </div>
                <Avatar className="h-12 w-12 border border-gray-200">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                  <AvatarFallback>{user.name[1].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <h3 className="font-bold text-lg">{user.name}</h3>
                  <p className="text-sm text-gray-500">{user.votes} participações</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
