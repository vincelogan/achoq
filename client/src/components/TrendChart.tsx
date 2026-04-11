import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { date: "01/01", left: 48, right: 52 },
  { date: "02/01", left: 49, right: 51 },
  { date: "03/01", left: 50, right: 50 },
  { date: "04/01", left: 52, right: 48 },
  { date: "05/01", left: 53, right: 47 },
  { date: "06/01", left: 54, right: 46 },
  { date: "07/01", left: 54, right: 46 },
];

export default function TrendChart() {
  return (
    <section className="w-full py-12 bg-gray-50 border-y border-gray-200">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Evolução da Expectativa
          </h2>
          <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Acompanhe como a expectativa coletiva mudou nas últimas semanas.
          </p>
        </div>
        
        <Card className="w-full max-w-4xl mx-auto shadow-none border-0 bg-transparent">
          <CardContent className="p-0 h-[300px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis 
                  dataKey="date" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}%`} 
                  domain={[40, 60]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #e5e5e5" }}
                  itemStyle={{ fontSize: "14px", fontWeight: "bold" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="left" 
                  stroke="#D60000" 
                  strokeWidth={3} 
                  dot={false} 
                  activeDot={{ r: 6 }} 
                  name="Esquerda"
                />
                <Line 
                  type="monotone" 
                  dataKey="right" 
                  stroke="#0047FF" 
                  strokeWidth={3} 
                  dot={false} 
                  activeDot={{ r: 6 }} 
                  name="Direita"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
