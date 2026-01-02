import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { toast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Star, ShoppingCart, BookOpen, Video, Users, 
  FileText, Clock, CheckCircle, Play, Lock
} from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  type: string;
  image_url: string | null;
  seller_id: string;
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
    level: number;
  };
}

interface CourseModule {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  course_lessons: {
    id: string;
    title: string;
    duration_minutes: number | null;
    is_free_preview: boolean;
    order_index: number;
  }[];
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'ebook':
      return <BookOpen className="h-5 w-5" />;
    case 'course':
      return <Video className="h-5 w-5" />;
    case 'mentoria':
      return <Users className="h-5 w-5" />;
    case 'template':
      return <FileText className="h-5 w-5" />;
    default:
      return <ShoppingCart className="h-5 w-5" />;
  }
};

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  useEffect(() => {
    if (userId && id) {
      checkPurchase();
    }
  }, [userId, id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles:seller_id (
            display_name,
            avatar_url,
            level
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);

      if (data?.type === 'course') {
        fetchModules();
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast({
        title: "Erro",
        description: "Produto não encontrado",
        variant: "destructive",
      });
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('course_modules')
        .select(`
          id,
          title,
          description,
          order_index,
          course_lessons (
            id,
            title,
            duration_minutes,
            is_free_preview,
            order_index
          )
        `)
        .eq('product_id', id)
        .order('order_index');

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  const checkPurchase = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('id')
        .eq('product_id', id)
        .eq('buyer_id', userId)
        .eq('status', 'completed')
        .maybeSingle();

      if (!error && data) {
        setHasPurchased(true);
      }
    } catch (error) {
      console.error("Error checking purchase:", error);
    }
  };

  const handlePurchase = async () => {
    if (!userId) {
      toast({
        title: "Login necessário",
        description: "Faça login para comprar produtos",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setPurchasing(true);
    try {
      // For now, we'll create a pending purchase
      // In a real implementation, this would redirect to Stripe
      const { data, error } = await supabase
        .from('purchases')
        .insert({
          product_id: id,
          buyer_id: userId,
          price_paid: product?.price || 0,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Redirecionando para pagamento...",
        description: "Você será redirecionado para completar a compra.",
      });

      // TODO: Integrate with Stripe checkout
      // For now, simulate successful purchase
      setTimeout(() => {
        setHasPurchased(true);
        toast({
          title: "Compra realizada!",
          description: "Você agora tem acesso ao produto.",
        });
      }, 2000);

    } catch (error) {
      console.error("Error creating purchase:", error);
      toast({
        title: "Erro",
        description: "Não foi possível processar a compra",
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const totalLessons = modules.reduce((acc, m) => acc + m.course_lessons.length, 0);
  const totalMinutes = modules.reduce((acc, m) => 
    acc + m.course_lessons.reduce((a, l) => a + (l.duration_minutes || 0), 0), 0
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/marketplace')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Image */}
            <div className="aspect-video bg-muted rounded-xl overflow-hidden">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center gradient-primary/20">
                  {getTypeIcon(product.type)}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="gap-1">
                  {getTypeIcon(product.type)}
                  {product.type.charAt(0).toUpperCase() + product.type.slice(1)}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
              
              {/* Seller Info */}
              <div className="flex items-center gap-3 mb-6">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={product.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="gradient-primary text-primary-foreground">
                    {product.profiles?.display_name?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{product.profiles?.display_name || "Anônimo"}</p>
                  <p className="text-sm text-muted-foreground">
                    Nível {product.profiles?.level || 1}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="description">
              <TabsList>
                <TabsTrigger value="description">Descrição</TabsTrigger>
                {product.type === 'course' && modules.length > 0 && (
                  <TabsTrigger value="content">Conteúdo</TabsTrigger>
                )}
                <TabsTrigger value="reviews">Avaliações</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="whitespace-pre-wrap">{product.description}</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {product.type === 'course' && modules.length > 0 && (
                <TabsContent value="content" className="mt-4 space-y-4">
                  {modules.map((module) => (
                    <Card key={module.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{module.title}</CardTitle>
                        {module.description && (
                          <p className="text-sm text-muted-foreground">{module.description}</p>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {module.course_lessons
                            .sort((a, b) => a.order_index - b.order_index)
                            .map((lesson) => (
                              <div 
                                key={lesson.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                              >
                                <div className="flex items-center gap-3">
                                  {hasPurchased || lesson.is_free_preview ? (
                                    <Play className="h-4 w-4 text-primary" />
                                  ) : (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className={lesson.is_free_preview ? "text-primary" : ""}>
                                    {lesson.title}
                                  </span>
                                  {lesson.is_free_preview && (
                                    <Badge variant="secondary" className="text-xs">Preview</Badge>
                                  )}
                                </div>
                                {lesson.duration_minutes && (
                                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {lesson.duration_minutes} min
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              )}
              
              <TabsContent value="reviews" className="mt-4">
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Nenhuma avaliação ainda.
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="pt-6 space-y-4">
                <div className="text-center">
                  <span className="text-4xl font-bold text-primary">
                    R$ {product.price.toFixed(2)}
                  </span>
                </div>

                {product.type === 'course' && modules.length > 0 && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <span>{totalLessons} aulas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{Math.round(totalMinutes / 60)}h de conteúdo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <span>Acesso vitalício</span>
                    </div>
                  </div>
                )}

                {hasPurchased ? (
                  <Button className="w-full gradient-success" disabled>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Você já possui este produto
                  </Button>
                ) : product.seller_id === userId ? (
                  <Button className="w-full" variant="outline" disabled>
                    Este é seu produto
                  </Button>
                ) : (
                  <Button 
                    className="w-full gradient-primary" 
                    onClick={handlePurchase}
                    disabled={purchasing}
                  >
                    {purchasing ? (
                      "Processando..."
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Comprar Agora
                      </>
                    )}
                  </Button>
                )}

                <p className="text-xs text-center text-muted-foreground">
                  Pagamento seguro via Stripe
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
