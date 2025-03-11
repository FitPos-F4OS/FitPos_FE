import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/pos/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CalendarIcon, TrendingUp, LineChart, ShoppingCart, Package, Users, ArrowLeft, Store } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // 대시보드에 표시할 가상 데이터
  const { data: cashier } = useQuery({
    queryKey: ['/api/users/current'],
    queryFn: () => Promise.resolve({ username: "관리자" }),
    staleTime: Infinity,
  });

  // 판매 요약 데이터 (가상)
  const salesSummary = {
    totalSales: "₩12,548,000",
    orders: 312,
    averageOrder: "₩40,218",
    percentChange: "+8.2%"
  };

  // 상위 판매 제품 데이터 (가상)
  const topSellingProducts = [
    { name: "프로틴 파우더 1kg", sales: 68, revenue: "₩5,439,000" },
    { name: "피트니스 트래커", sales: 42, revenue: "₩8,399,000" },
    { name: "프리미엄 덤벨 세트", sales: 35, revenue: "₩3,149,000" },
    { name: "요가 레깅스", sales: 30, revenue: "₩1,799,000" },
  ];

  // 월간 판매 데이터 (가상)
  const monthlySalesData = [
    { name: "1월", sales: 4000 },
    { name: "2월", sales: 3000 },
    { name: "3월", sales: 2000 },
    { name: "4월", sales: 2780 },
    { name: "5월", sales: 1890 },
    { name: "6월", sales: 2390 },
    { name: "7월", sales: 3490 },
    { name: "8월", sales: 4000 },
    { name: "9월", sales: 5000 },
    { name: "10월", sales: 6000 },
    { name: "11월", sales: 7000 },
    { name: "12월", sales: 8000 },
  ];

  // 카테고리별 판매 데이터 (가상)
  const categorySalesData = [
    { name: "운동 장비", value: 35 },
    { name: "단백질 보충제", value: 25 },
    { name: "운동복", value: 20 },
    { name: "액세서리", value: 10 },
    { name: "영양제", value: 8 },
    { name: "피트니스 기기", value: 2 },
  ];

  return (
    <div className="flex flex-col h-screen">
      <Header cashier={cashier?.username || "Loading..."} />
      
      <div className="flex-1 overflow-auto bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">대시보드</h1>
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2">
                <Store className="h-4 w-4" />
                POS로 돌아가기
              </Button>
            </Link>
          </div>
          
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="p-1 bg-gray-100/80 backdrop-blur-sm rounded-xl shadow-inner">
              <TabsTrigger value="overview" className="font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary">
                <div className="flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  <span>개요</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="sales" className="font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary">
                <div className="flex items-center gap-2">
                  <LineChart className="h-4 w-4" />
                  <span>판매 분석</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="inventory" className="font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>재고 관리</span>
                </div>
              </TabsTrigger>
            </TabsList>
            
            {/* 개요 탭 */}
            <TabsContent value="overview" className="space-y-4">
              {/* 판매 요약 카드들 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      총 매출
                    </CardTitle>
                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{salesSummary.totalSales}</div>
                    <p className="text-xs flex items-center gap-1 text-green-600">
                      <TrendingUp className="h-3 w-3" /> 
                      전월 대비 {salesSummary.percentChange}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="h-1 bg-gradient-to-r from-indigo-600 to-indigo-400"></div>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      주문 건수
                    </CardTitle>
                    <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
                      <ShoppingCart className="h-4 w-4 text-indigo-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{salesSummary.orders}</div>
                    <p className="text-xs text-muted-foreground">
                      평균 주문 가격: {salesSummary.averageOrder}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="h-1 bg-gradient-to-r from-purple-600 to-purple-400"></div>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      제품
                    </CardTitle>
                    <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
                      <Package className="h-4 w-4 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">198</div>
                    <p className="text-xs text-muted-foreground">
                      재고 부족: <span className="text-amber-600">12개</span>
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="h-1 bg-gradient-to-r from-cyan-600 to-cyan-400"></div>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      고객
                    </CardTitle>
                    <div className="h-8 w-8 rounded-full bg-cyan-50 flex items-center justify-center">
                      <Users className="h-4 w-4 text-cyan-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">573</div>
                    <p className="text-xs text-muted-foreground">
                      이번달 신규: <span className="text-blue-600">42명</span>
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* 차트 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="col-span-1 overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-400"></div>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-medium">월별 매출</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <LineChart className="h-4 w-4 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlySalesData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
                        <YAxis tick={{ fill: '#6b7280' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            border: 'none'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="sales" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card className="col-span-1 overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="h-1 bg-gradient-to-r from-purple-600 to-pink-400"></div>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-medium">카테고리별 매출</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
                      <LineChart className="h-4 w-4 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categorySalesData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {categorySalesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            border: 'none'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              
              {/* 인기 제품 */}
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="h-1 bg-gradient-to-r from-cyan-600 to-blue-400"></div>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-medium">인기 제품</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-cyan-50 flex items-center justify-center">
                    <Package className="h-4 w-4 text-cyan-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {topSellingProducts.map((product, i) => (
                      <div key={i} className="flex items-center p-3 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold mr-4">
                          {i + 1}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {product.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {product.sales}개 판매
                          </p>
                        </div>
                        <div className="ml-auto font-medium text-blue-600">{product.revenue}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* 판매 분석 탭 */}
            <TabsContent value="sales" className="space-y-4">
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-400"></div>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-medium">판매 상세 분석</CardTitle>
                    <CardDescription>
                      시간별, 제품별, 결제 방법별 판매 데이터를 확인하세요.
                    </CardDescription>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <LineChart className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-4">
                    <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center mb-2">
                      <CalendarIcon className="h-10 w-10 text-blue-500 opacity-80" />
                    </div>
                    <p className="text-lg font-medium text-gray-700">기능 준비 중</p>
                    <p className="text-sm text-muted-foreground max-w-md">
                      향후 업데이트에서 추가될 기능입니다. 매출 분석, 추세 분석, 예측 기능이 포함될 예정입니다.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* 재고 관리 탭 */}
            <TabsContent value="inventory" className="space-y-4">
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="h-1 bg-gradient-to-r from-indigo-600 to-purple-400"></div>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-medium">재고 관리</CardTitle>
                    <CardDescription>
                      현재 재고 상태와 재고 부족 제품을 확인하세요.
                    </CardDescription>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
                    <Package className="h-5 w-5 text-indigo-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-4">
                    <div className="h-20 w-20 rounded-full bg-indigo-50 flex items-center justify-center mb-2">
                      <Package className="h-10 w-10 text-indigo-500 opacity-80" />
                    </div>
                    <p className="text-lg font-medium text-gray-700">기능 준비 중</p>
                    <p className="text-sm text-muted-foreground max-w-md">
                      향후 업데이트에서 추가될 기능입니다. 재고 추적, 자동 발주, 재고 부족 알림 기능이 포함될 예정입니다.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

