import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface ProfileFormProps {
  userId: string;
}

const ProfileForm = ({ userId }: ProfileFormProps) => {
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      toast({ title: "Erro ao carregar perfil", description: error.message, variant: "destructive" });
    } else {
      setProfile(data || {});
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: profile.name,
        age: profile.age,
        ocupacao: profile.ocupacao,
        rotina: profile.rotina,
        ambiente: profile.ambiente,
        mentalidade: profile.mentalidade,
        informacoes_extras: profile.informacoes_extras,
      })
      .eq("id", userId);
    if (error) {
      toast({ title: "Erro ao salvar perfil", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!", description: "Suas informações foram salvas." });
      fetchProfile();
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações do Perfil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input name="name" value={profile.name || ""} onChange={handleChange} placeholder="Nome" />
        <Input name="age" value={profile.age || ""} onChange={handleChange} placeholder="Idade" type="number" />
        <Input name="ocupacao" value={profile.ocupacao || ""} onChange={handleChange} placeholder="Ocupação" />
        <Textarea name="rotina" value={profile.rotina || ""} onChange={handleChange} placeholder="Descreva sua rotina" />
        <Input name="ambiente" value={profile.ambiente || ""} onChange={handleChange} placeholder="Ambiente (ex: família, colegas, sozinho)" />
        <Input name="mentalidade" value={profile.mentalidade || ""} onChange={handleChange} placeholder="Mentalidade (ex: motivação, foco)" />
        <Textarea name="informacoes_extras" value={profile.informacoes_extras || ""} onChange={handleChange} placeholder="Informações adicionais" />
        <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
      </CardContent>
    </Card>
  );
};

export default ProfileForm;
