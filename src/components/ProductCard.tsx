import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, BookOpen, Video, Users, FileText, ShoppingCart } from "lucide-react";

interface ProductCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  type: string;
  imageUrl?: string | null;
  sellerName?: string;
  sellerAvatar?: string | null;
  rating?: number;
  reviewCount?: number;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'ebook':
      return <BookOpen className="h-4 w-4" />;
    case 'course':
      return <Video className="h-4 w-4" />;
    case 'mentoria':
      return <Users className="h-4 w-4" />;
    case 'template':
      return <FileText className="h-4 w-4" />;
    default:
      return <ShoppingCart className="h-4 w-4" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'ebook':
      return 'E-book';
    case 'course':
      return 'Curso';
    case 'mentoria':
      return 'Mentoria';
    case 'template':
      return 'Template';
    default:
      return type;
  }
};

export const ProductCard = ({
  id,
  title,
  description,
  price,
  type,
  imageUrl,
  sellerName,
  sellerAvatar,
  rating = 0,
  reviewCount = 0,
}: ProductCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden hover:shadow-large transition-all duration-300 group cursor-pointer" onClick={() => navigate(`/product/${id}`)}>
      <div className="relative aspect-video bg-muted overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center gradient-primary/20">
            {getTypeIcon(type)}
          </div>
        )}
        <Badge className="absolute top-2 left-2 gap-1">
          {getTypeIcon(type)}
          {getTypeLabel(type)}
        </Badge>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {description}
        </p>
        
        {sellerName && (
          <div className="flex items-center gap-2 mt-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={sellerAvatar || undefined} />
              <AvatarFallback className="text-xs">
                {sellerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{sellerName}</span>
          </div>
        )}
        
        {rating > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            <span className="text-sm font-medium">{rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({reviewCount})</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div>
          <span className="text-2xl font-bold text-primary">
            R$ {price.toFixed(2)}
          </span>
        </div>
        <Button size="sm" className="gradient-primary" onClick={(e) => {
          e.stopPropagation();
          navigate(`/product/${id}`);
        }}>
          Ver Detalhes
        </Button>
      </CardFooter>
    </Card>
  );
};
