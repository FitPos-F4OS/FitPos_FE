import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePos } from "@/lib/pos-context";

interface Product {
  id: number;
  name: string;
  price: string;
  imageUrl: string;
  categoryId: number;
  inventory: number;
}

interface Category {
  id: number;
  name: string;
}

export default function ProductSection() {
  const { toast } = useToast();
  const { addToCart } = usePos();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Update filtered products when search or category changes
  useEffect(() => {
    if (!products) return;

    let filtered = [...products];
    
    // Filter by category if one is selected
    if (activeCategory !== null) {
      filtered = filtered.filter(product => product.categoryId === activeCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(term)
      );
    }
    
    setFilteredProducts(filtered);
  }, [products, activeCategory, searchTerm]);

  // Handle category change
  const handleCategoryChange = (value: string) => {
    if (value === "all") {
      setActiveCategory(null);
    } else {
      setActiveCategory(parseInt(value));
    }
  };

  // Handle adding product to cart
  const handleAddToCart = (product: Product) => {
    if (product.inventory <= 0) {
      toast({
        title: "Out of stock",
        description: `${product.name} is currently out of stock.`,
        variant: "destructive",
      });
      return;
    }
    
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: 1
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <div className="w-full lg:w-2/3 bg-white overflow-hidden flex flex-col">
      {/* Categories and Search */}
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 md:items-center">
          <div className="relative rounded-md flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search products..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="default" size="sm" className="whitespace-nowrap">
            <Filter className="h-5 w-5 mr-2" />
            Filter
          </Button>
        </div>

        {/* Category tabs */}
        <div className="mt-4 border-b border-gray-200">
          {categoriesLoading ? (
            <div className="flex space-x-4 pb-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          ) : (
            <Tabs 
              defaultValue="all" 
              onValueChange={handleCategoryChange}
              className="w-full overflow-x-auto"
            >
              <TabsList className="justify-start h-10 w-full bg-transparent">
                <TabsTrigger value="all" className="h-9 data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:text-primary rounded-none">
                  All
                </TabsTrigger>
                {categories?.map((category) => (
                  <TabsTrigger 
                    key={category.id} 
                    value={String(category.id)}
                    className="h-9 data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:text-primary rounded-none"
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        {productsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="flex flex-col space-y-2 border rounded-lg p-3">
                <Skeleton className="h-32 w-full rounded-md" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-500">No products found</p>
            {searchTerm && (
              <Button 
                variant="link" 
                onClick={() => setSearchTerm("")}
                className="mt-2"
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className="bg-white border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="object-cover h-32 w-full"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{product.name}</h3>
                  <p className="text-primary font-semibold mt-1">${product.price}</p>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="mt-2 w-full"
                    disabled={product.inventory <= 0}
                    onClick={() => handleAddToCart(product)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
