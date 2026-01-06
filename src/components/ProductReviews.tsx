import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Star, Send } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface ProductReviewsProps {
  productId: string;
  hasPurchased: boolean;
  userId: string | null;
}

const ProductReviews = ({ productId, hasPurchased, userId }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  useEffect(() => {
    if (userId && reviews.length > 0) {
      setHasReviewed(reviews.some(r => r.user_id === userId));
    }
  }, [reviews, userId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each review
      const reviewsWithProfiles = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profileData } = await supabase
            .rpc('get_public_profile', { profile_id: review.user_id });
          
          return {
            ...review,
            profile: profileData?.[0] || null,
          };
        })
      );

      setReviews(reviewsWithProfiles);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!userId) {
      toast({
        title: "Login necessário",
        description: "Faça login para deixar uma avaliação",
        variant: "destructive",
      });
      return;
    }

    if (!hasPurchased) {
      toast({
        title: "Compra necessária",
        description: "Você precisa comprar o produto para avaliá-lo",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: productId,
          user_id: userId,
          rating,
          comment: comment.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Avaliação enviada!",
        description: "Obrigado por avaliar este produto.",
      });

      setComment("");
      setRating(5);
      fetchReviews();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar a avaliação",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (value: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= value 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-muted-foreground"
            } ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
            onClick={() => interactive && setRating(star)}
          />
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-4xl font-bold">{averageRating.toFixed(1)}</p>
          {renderStars(Math.round(averageRating))}
          <p className="text-sm text-muted-foreground mt-1">
            {reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"}
          </p>
        </div>
      </div>

      {/* Review Form */}
      {hasPurchased && !hasReviewed && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h4 className="font-semibold">Deixe sua avaliação</h4>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Sua nota:</p>
              {renderStars(rating, true)}
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escreva um comentário (opcional)..."
              rows={3}
            />
            <Button 
              onClick={handleSubmitReview} 
              disabled={submitting}
              className="gradient-primary"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? "Enviando..." : "Enviar Avaliação"}
            </Button>
          </CardContent>
        </Card>
      )}

      {hasReviewed && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Você já avaliou este produto.
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {loading ? (
        <p className="text-center text-muted-foreground">Carregando avaliações...</p>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Nenhuma avaliação ainda. Seja o primeiro a avaliar!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={review.profile?.avatar_url || undefined} />
                    <AvatarFallback className="gradient-primary text-primary-foreground">
                      {review.profile?.display_name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{review.profile?.display_name || "Usuário"}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="mt-1">{renderStars(review.rating)}</div>
                    {review.comment && (
                      <p className="mt-2 text-muted-foreground">{review.comment}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
