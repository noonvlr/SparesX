import { Card, CardContent, CardHeader, CardTitle } from '@sparesx/ui';
import Link from 'next/link';
import { Car, Cpu, Wrench, Smartphone, Home, Gamepad2 } from 'lucide-react';

const categories = [
  {
    name: 'Automotive',
    slug: 'automotive',
    icon: Car,
    description: 'Car parts, engines, transmissions, and more',
    color: 'bg-blue-500',
  },
  {
    name: 'Electronics',
    slug: 'electronics',
    icon: Cpu,
    description: 'Computer components, circuit boards, and electronic parts',
    color: 'bg-green-500',
  },
  {
    name: 'Tools & Equipment',
    slug: 'tools',
    icon: Wrench,
    description: 'Professional tools and equipment for technicians',
    color: 'bg-orange-500',
  },
  {
    name: 'Mobile & Gadgets',
    slug: 'mobile',
    icon: Smartphone,
    description: 'Phone parts, tablets, and mobile accessories',
    color: 'bg-purple-500',
  },
  {
    name: 'Home Appliances',
    slug: 'appliances',
    icon: Home,
    description: 'Kitchen appliances, HVAC parts, and home electronics',
    color: 'bg-red-500',
  },
  {
    name: 'Gaming & Entertainment',
    slug: 'gaming',
    icon: Gamepad2,
    description: 'Gaming consoles, controllers, and entertainment systems',
    color: 'bg-pink-500',
  },
];

export function Categories() {

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Browse by Category</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find spare parts organized by category. From automotive to electronics, 
            we have everything you need.
          </p>
        </div>

        {/* Quick Access Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link key={category.slug} href={`/products?category=${category.slug}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${category.color} text-white`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {category.name}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link href="/categories">
            <button className="text-primary hover:underline font-medium">
              View All Categories →
            </button>
          </Link>
        </div>
      </div>

    </section>
  );
}





