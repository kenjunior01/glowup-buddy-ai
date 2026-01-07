import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle, ArrowLeft, HelpCircle } from "lucide-react";

const PaymentCanceled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              Pagamento Cancelado
            </h1>
            <p className="text-muted-foreground">
              O pagamento foi cancelado. Você não foi cobrado.
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <Button 
              className="w-full" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Produto
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/marketplace')}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Explorar Marketplace
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCanceled;
