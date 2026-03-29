import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Globe2 } from "lucide-react";

const regions = [
  { name: "Sudeste", percentage: 48 },
  { name: "Nordeste", percentage: 24 },
  { name: "Sul", percentage: 15 },
  { name: "Centro-Oeste", percentage: 8 },
  { name: "Norte", percentage: 5 },
];

const countries = [
  { name: "Brasil", percentage: 94 },
  { name: "Estados Unidos", percentage: 3 },
  { name: "Portugal", percentage: 2 },
  { name: "Outros", percentage: 1 },
];

export default function Demographics() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Demografia da Participação
          </h2>
          <p className="max-w-[600px] text-gray-500 text-sm md:text-base">
            Distribuição geográfica das opiniões registradas no mercado.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
          {/* Regiões do Brasil */}
          <Card className="achoq-card border border-gray-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                <MapPin className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">Regiões do Brasil</h3>
              </div>
              
              <div className="space-y-5">
                {regions.map((region) => (
                  <div key={region.name} className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{region.name}</span>
                      <span className="text-gray-500">{region.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#0047FF] rounded-full" 
                        style={{ width: `${region.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Países */}
          <Card className="achoq-card border border-gray-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                <Globe2 className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">Países</h3>
              </div>
              
              <div className="space-y-5">
                {countries.map((country) => (
                  <div key={country.name} className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{country.name}</span>
                      <span className="text-gray-500">{country.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#D60000] rounded-full" 
                        style={{ width: `${country.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
