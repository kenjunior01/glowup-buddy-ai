import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Camera, Upload, Sparkles, Eye, Smile, Activity, Lock, ArrowRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface AnalysisResult {
  overall_score: number;
  symmetry: number;
  skin_quality: number;
  jawline: number;
  eye_area: number;
  recommendations: string[];
  summary: string;
}

export default function Looksmaxxing() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        supabase.from('profiles').select('subscription_tier').eq('id', session.user.id).single()
          .then(({ data }) => setIsPremium(data?.subscription_tier === 'premium'));
      }
    });
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande (max 5MB)'); return; }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setResult(null);
  };

  const analyzePhoto = async () => {
    if (!imagePreview || !userId) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('looksmaxxing-analysis', {
        body: { image: imagePreview },
      });
      if (error) throw error;
      setResult(data);
      toast.success('Análise completa! ✨');
    } catch (e) {
      console.error(e);
      toast.error('Erro na análise. Tente novamente.');
    } finally {
      setAnalyzing(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-400';
  };

  const scoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-400';
    if (score >= 60) return 'from-yellow-500 to-amber-400';
    return 'from-red-500 to-orange-400';
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Camera className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-bold mb-2">Looksmaxxing AI</h2>
            <p className="text-muted-foreground mb-6">Faça login para analisar sua aparência com IA</p>
            <Button onClick={() => navigate('/auth')} className="gradient-button text-white">
              Entrar <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Hero */}
        <div className="text-center pt-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-1.5 rounded-full text-xs font-medium text-primary mb-4">
            <Sparkles className="w-3 h-3" /> Powered by AI
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Looksmaxxing AI</h1>
          <p className="text-sm text-muted-foreground">Análise facial inteligente para maximizar seu potencial</p>
        </div>

        {/* Upload area */}
        {!result && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300",
              imagePreview ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/30"
            )}
          >
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            
            {imagePreview ? (
              <div className="space-y-4">
                <img src={imagePreview} alt="Preview" className="w-48 h-48 object-cover rounded-2xl mx-auto shadow-lg" />
                <p className="text-sm text-muted-foreground">Toque para trocar a foto</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-primary" />
                </div>
                <p className="font-medium text-foreground">Envie sua selfie</p>
                <p className="text-xs text-muted-foreground">JPG ou PNG, máx 5MB. Rosto centralizado e boa iluminação.</p>
              </div>
            )}
          </div>
        )}

        {/* Analyze button */}
        {imagePreview && !result && (
          <Button
            onClick={analyzePhoto}
            disabled={analyzing}
            className="w-full gradient-button text-white h-12 text-base font-semibold rounded-xl"
          >
            {analyzing ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analisando sua transformação...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Analisar com IA
              </span>
            )}
          </Button>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* Overall Score */}
            <div className="bento-card text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Seu Score Geral</p>
              <div className={cn("text-5xl font-extrabold", scoreColor(result.overall_score))}>
                {result.overall_score}
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{result.summary}</p>
            </div>

            {/* Category Scores */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Simetria', value: result.symmetry, icon: Eye },
                { label: 'Pele', value: result.skin_quality, icon: Sparkles },
                { label: 'Mandíbula', value: result.jawline, icon: Activity },
                { label: 'Área dos Olhos', value: result.eye_area, icon: Smile },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bento-card">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">{label}</span>
                  </div>
                  <div className={cn("text-2xl font-bold", scoreColor(value))}>{value}</div>
                  <div className="xp-bar mt-2">
                    <div className={cn("h-full rounded-full bg-gradient-to-r", scoreGradient(value))} style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            <div className="bento-card">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Recomendações
              </h3>
              <div className="space-y-2">
                {result.recommendations.slice(0, isPremium ? undefined : 2).map((rec, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec}</p>
                  </div>
                ))}
              </div>

              {!isPremium && result.recommendations.length > 2 && (
                <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-primary">+{result.recommendations.length - 2} recomendações Premium</span>
                  </div>
                  <Button size="sm" onClick={() => navigate('/premium')} className="gradient-button text-white text-xs">
                    Desbloquear Relatório Completo
                  </Button>
                </div>
              )}
            </div>

            {/* Reset */}
            <Button variant="outline" className="w-full" onClick={() => { setResult(null); setImagePreview(null); }}>
              <RotateCcw className="w-4 h-4 mr-2" /> Nova Análise
            </Button>
          </div>
        )}
      </div>
      <MobileBottomNav />
    </div>
  );
}
