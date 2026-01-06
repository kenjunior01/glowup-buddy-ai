import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Upload, Trash2 } from "lucide-react";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    short_description: "",
    price_cents: 0,
    product_type: "ebook" as "ebook" | "curso" | "mentoria",
    status: "draft" as "draft" | "published" | "archived",
    cover_image_url: "",
    file_url: "",
  });

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('seller_id', session.user.id)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title || "",
        description: data.description || "",
        short_description: data.short_description || "",
        price_cents: data.price_cents || 0,
        product_type: data.product_type,
        status: data.status,
        cover_image_url: data.cover_image_url || "",
        file_url: data.file_url || "",
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      toast({
        title: "Erro",
        description: "Produto não encontrado ou você não tem permissão",
        variant: "destructive",
      });
      navigate('/seller-dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, cover_image_url: publicUrl }));
      toast({ title: "Imagem enviada com sucesso!" });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Erro ao enviar imagem",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Digite um título para o produto",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          title: formData.title,
          description: formData.description,
          short_description: formData.short_description,
          price_cents: formData.price_cents,
          product_type: formData.product_type,
          status: formData.status,
          cover_image_url: formData.cover_image_url,
          file_url: formData.file_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Produto atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });
      navigate('/seller-dashboard');
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/seller-dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Editar Produto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cover Image */}
            <div className="space-y-2">
              <Label>Imagem de Capa</Label>
              <div className="flex items-center gap-4">
                {formData.cover_image_url ? (
                  <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={formData.cover_image_url} 
                      alt="Cover" 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => setFormData(prev => ({ ...prev, cover_image_url: "" }))}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-32 h-20 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    Sem imagem
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="max-w-[200px]"
                  />
                  {uploadingImage && <p className="text-sm text-muted-foreground mt-1">Enviando...</p>}
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nome do produto"
              />
            </div>

            {/* Short Description */}
            <div className="space-y-2">
              <Label htmlFor="short_description">Descrição Curta</Label>
              <Input
                id="short_description"
                value={formData.short_description}
                onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                placeholder="Breve descrição para listagem"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição Completa</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição detalhada do produto"
                rows={6}
              />
            </div>

            {/* Type and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select 
                  value={formData.product_type}
                  onValueChange={(value: "ebook" | "curso" | "mentoria") => 
                    setFormData(prev => ({ ...prev, product_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ebook">E-book</SelectItem>
                    <SelectItem value="curso">Curso</SelectItem>
                    <SelectItem value="mentoria">Mentoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(value: "draft" | "published" | "archived") => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={(formData.price_cents / 100).toFixed(2)}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  price_cents: Math.round(parseFloat(e.target.value || "0") * 100)
                }))}
                placeholder="0.00"
              />
            </div>

            {/* File URL for ebooks */}
            {formData.product_type === 'ebook' && (
              <div className="space-y-2">
                <Label htmlFor="file_url">URL do Arquivo (PDF)</Label>
                <Input
                  id="file_url"
                  value={formData.file_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, file_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => navigate('/seller-dashboard')}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gradient-primary">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditProduct;
