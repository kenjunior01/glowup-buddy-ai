import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import { Confetti } from "@/components/Confetti";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showConfetti, setShowConfetti] = useState(true);
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Confetti isActive={showConfetti} />
      
      <Card className="max-w-md w-full border-2 border-primary/20">
        <CardContent className="pt-8 pb-6 text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <Sparkles className="h-6 w-6 text-yellow-500 absolute top-0 right-1/4 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-primary">
              Pagamento Confirmado! 🎉
            </h1>
            <p className="text-muted-foreground">
              Sua compra foi processada com sucesso. Você já tem acesso ao seu produto!
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <Button 
              className="w-full gradient-primary" 
              onClick={() => navigate('/my-purchases')}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Ver Minhas Compras
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/marketplace')}
            >
              Continuar Explorando
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Um email de confirmação foi enviado para você.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
