export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ad_pricing: {
        Row: {
          ad_type: Database["public"]["Enums"]["ad_type"]
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price_per_day_cents: number
          price_per_month_cents: number
          price_per_week_cents: number
          updated_at: string | null
        }
        Insert: {
          ad_type: Database["public"]["Enums"]["ad_type"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price_per_day_cents?: number
          price_per_month_cents?: number
          price_per_week_cents?: number
          updated_at?: string | null
        }
        Update: {
          ad_type?: Database["public"]["Enums"]["ad_type"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_per_day_cents?: number
          price_per_month_cents?: number
          price_per_week_cents?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      advertisements: {
        Row: {
          ad_type: Database["public"]["Enums"]["ad_type"]
          admin_notes: string | null
          amount_paid_cents: number | null
          background_color: string | null
          clicks_count: number | null
          content: string
          created_at: string | null
          duration_days: number | null
          expires_at: string | null
          id: string
          image_url: string | null
          link_url: string | null
          priority: number | null
          starts_at: string | null
          status: Database["public"]["Enums"]["ad_status"] | null
          text_color: string | null
          title: string
          updated_at: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          ad_type: Database["public"]["Enums"]["ad_type"]
          admin_notes?: string | null
          amount_paid_cents?: number | null
          background_color?: string | null
          clicks_count?: number | null
          content: string
          created_at?: string | null
          duration_days?: number | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          priority?: number | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["ad_status"] | null
          text_color?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          ad_type?: Database["public"]["Enums"]["ad_type"]
          admin_notes?: string | null
          amount_paid_cents?: number | null
          background_color?: string | null
          clicks_count?: number | null
          content?: string
          created_at?: string | null
          duration_days?: number | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          priority?: number | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["ad_status"] | null
          text_color?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: []
      }
      challenges: {
        Row: {
          buddy_accepted: boolean | null
          buddy_completed: boolean | null
          buddy_id: string | null
          challenge_type: string | null
          challenger_id: string | null
          completed_at: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          expires_at: string | null
          id: string
          is_buddy_challenge: boolean | null
          reward_points: number | null
          status: string | null
          target_user_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          buddy_accepted?: boolean | null
          buddy_completed?: boolean | null
          buddy_id?: string | null
          challenge_type?: string | null
          challenger_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_buddy_challenge?: boolean | null
          reward_points?: number | null
          status?: string | null
          target_user_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          buddy_accepted?: boolean | null
          buddy_completed?: boolean | null
          buddy_id?: string | null
          challenge_type?: string | null
          challenger_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_buddy_challenge?: boolean | null
          reward_points?: number | null
          status?: string | null
          target_user_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      course_lessons: {
        Row: {
          content: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          is_free_preview: boolean | null
          module_id: string
          order_index: number
          title: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_free_preview?: boolean | null
          module_id: string
          order_index?: number
          title: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_free_preview?: boolean | null
          module_id?: string
          order_index?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          order_index: number
          product_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number
          product_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number
          product_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      course_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          lesson_id: string
          product_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id: string
          product_id: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_progress_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string | null
          goal_description: string
          goal_type: string | null
          id: string
          status: string | null
          target_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          goal_description: string
          goal_type?: string | null
          id?: string
          status?: string | null
          target_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          goal_description?: string
          goal_type?: string | null
          id?: string
          status?: string | null
          target_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          ai_analysis: string | null
          content: string
          created_at: string
          id: string
          mood_score: number | null
          pillar: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analysis?: string | null
          content: string
          created_at?: string
          id?: string
          mood_score?: number | null
          pillar?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analysis?: string | null
          content?: string
          created_at?: string
          id?: string
          mood_score?: number | null
          pillar?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mentoria_sessions: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          id: string
          meeting_url: string | null
          mentor_id: string
          notes: string | null
          product_id: string
          scheduled_at: string | null
          status: string | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_url?: string | null
          mentor_id: string
          notes?: string | null
          product_id: string
          scheduled_at?: string | null
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_url?: string | null
          mentor_id?: string
          notes?: string | null
          product_id?: string
          scheduled_at?: string | null
          status?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentoria_sessions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_ai: boolean | null
          read_at: string | null
          receiver_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_ai?: boolean | null
          read_at?: string | null
          receiver_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_ai?: boolean | null
          read_at?: string | null
          receiver_id?: string | null
          sender_id?: string
        }
        Relationships: []
      }
      mood_logs: {
        Row: {
          created_at: string | null
          date: string | null
          energy_level: number | null
          id: string
          mood_label: string
          mood_score: number
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          energy_level?: number | null
          id?: string
          mood_label: string
          mood_score: number
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string | null
          energy_level?: number | null
          id?: string
          mood_label?: string
          mood_score?: number
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          active: boolean | null
          completed: boolean | null
          content: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          goal_id: string | null
          id: string
          plan_type: string | null
          start_date: string | null
          steps: Json | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          completed?: boolean | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          goal_id?: string | null
          id?: string
          plan_type?: string | null
          start_date?: string | null
          steps?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          completed?: boolean | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          goal_id?: string | null
          id?: string
          plan_type?: string | null
          start_date?: string | null
          steps?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          product_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          product_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          product_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          currency: string
          description: string | null
          file_url: string | null
          id: string
          is_featured: boolean | null
          metadata: Json | null
          price_cents: number
          product_type: Database["public"]["Enums"]["product_type"]
          rating_avg: number | null
          rating_count: number | null
          seller_id: string
          short_description: string | null
          status: Database["public"]["Enums"]["product_status"]
          title: string
          total_sales: number | null
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_featured?: boolean | null
          metadata?: Json | null
          price_cents?: number
          product_type: Database["public"]["Enums"]["product_type"]
          rating_avg?: number | null
          rating_count?: number | null
          seller_id: string
          short_description?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          title: string
          total_sales?: number | null
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_featured?: boolean | null
          metadata?: Json | null
          price_cents?: number
          product_type?: Database["public"]["Enums"]["product_type"]
          rating_avg?: number | null
          rating_count?: number | null
          seller_id?: string
          short_description?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          title?: string
          total_sales?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          ambiente: string | null
          avatar_url: string | null
          conquistas: string[] | null
          created_at: string | null
          display_name: string | null
          experience_points: number | null
          id: string
          informacoes_extras: string | null
          level: number | null
          mentalidade: string | null
          name: string | null
          ocupacao: string | null
          onboarding_completed: boolean | null
          onboarding_preferences: Json | null
          pontos: number | null
          rotina: string | null
          selected_pillars: string[] | null
          total_challenges_completed: number | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          ambiente?: string | null
          avatar_url?: string | null
          conquistas?: string[] | null
          created_at?: string | null
          display_name?: string | null
          experience_points?: number | null
          id: string
          informacoes_extras?: string | null
          level?: number | null
          mentalidade?: string | null
          name?: string | null
          ocupacao?: string | null
          onboarding_completed?: boolean | null
          onboarding_preferences?: Json | null
          pontos?: number | null
          rotina?: string | null
          selected_pillars?: string[] | null
          total_challenges_completed?: number | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          ambiente?: string | null
          avatar_url?: string | null
          conquistas?: string[] | null
          created_at?: string | null
          display_name?: string | null
          experience_points?: number | null
          id?: string
          informacoes_extras?: string | null
          level?: number | null
          mentalidade?: string | null
          name?: string | null
          ocupacao?: string | null
          onboarding_completed?: boolean | null
          onboarding_preferences?: Json | null
          pontos?: number | null
          rotina?: string | null
          selected_pillars?: string[] | null
          total_challenges_completed?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      progress: {
        Row: {
          completed_tasks: number | null
          completion_rate: number | null
          created_at: string | null
          goal_id: string | null
          id: string
          notes: string | null
          plan_id: string | null
          progress_notes: string | null
          progress_percentage: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_tasks?: number | null
          completion_rate?: number | null
          created_at?: string | null
          goal_id?: string | null
          id?: string
          notes?: string | null
          plan_id?: string | null
          progress_notes?: string | null
          progress_percentage?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_tasks?: number | null
          completion_rate?: number | null
          created_at?: string | null
          goal_id?: string | null
          id?: string
          notes?: string | null
          plan_id?: string | null
          progress_notes?: string | null
          progress_percentage?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          amount_cents: number
          buyer_id: string
          completed_at: string | null
          created_at: string | null
          currency: string
          id: string
          payment_intent_id: string | null
          platform_fee_cents: number | null
          product_id: string
          seller_amount_cents: number
          seller_id: string
          status: Database["public"]["Enums"]["purchase_status"]
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          buyer_id: string
          completed_at?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          payment_intent_id?: string | null
          platform_fee_cents?: number | null
          product_id: string
          seller_amount_cents: number
          seller_id: string
          status?: Database["public"]["Enums"]["purchase_status"]
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          buyer_id?: string
          completed_at?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          payment_intent_id?: string | null
          platform_fee_cents?: number | null
          product_id?: string
          seller_amount_cents?: number
          seller_id?: string
          status?: Database["public"]["Enums"]["purchase_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          content: string
          created_at: string
          expires_at: string
          id: string
          image_url: string | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          expires_at?: string
          id?: string
          image_url?: string | null
          type?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          expires_at?: string
          id?: string
          image_url?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      story_likes: {
        Row: {
          created_at: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_likes_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          freeze_tokens: number | null
          freeze_tokens_used: number | null
          id: string
          last_activity_date: string | null
          last_freeze_date: string | null
          longest_streak: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          freeze_tokens?: number | null
          freeze_tokens_used?: number | null
          id?: string
          last_activity_date?: string | null
          last_freeze_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          freeze_tokens?: number | null
          freeze_tokens_used?: number | null
          id?: string
          last_activity_date?: string | null
          last_freeze_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_summaries: {
        Row: {
          ai_insights: string | null
          challenges_completed: number | null
          created_at: string | null
          highlights: Json | null
          id: string
          mood_average: number | null
          next_week_goals: Json | null
          points_earned: number | null
          streak_days: number | null
          tasks_completed: number | null
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          ai_insights?: string | null
          challenges_completed?: number | null
          created_at?: string | null
          highlights?: Json | null
          id?: string
          mood_average?: number | null
          next_week_goals?: Json | null
          points_earned?: number | null
          streak_days?: number | null
          tasks_completed?: number | null
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          ai_insights?: string | null
          challenges_completed?: number | null
          created_at?: string | null
          highlights?: Json | null
          id?: string
          mood_average?: number | null
          next_week_goals?: Json | null
          points_earned?: number | null
          streak_days?: number | null
          tasks_completed?: number | null
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_leaderboard: {
        Args: { limit_count?: number }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
          level: number
          pontos: number
          total_challenges_completed: number
        }[]
      }
      get_public_profile: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
          level: number
          pontos: number
          total_challenges_completed: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ad_status: "pending" | "approved" | "rejected" | "active" | "expired"
      ad_type: "ticker" | "premium_banner" | "mid_page"
      app_role: "admin" | "moderator" | "user"
      product_status: "draft" | "published" | "archived"
      product_type: "ebook" | "mentoria" | "curso"
      purchase_status: "pending" | "completed" | "refunded" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ad_status: ["pending", "approved", "rejected", "active", "expired"],
      ad_type: ["ticker", "premium_banner", "mid_page"],
      app_role: ["admin", "moderator", "user"],
      product_status: ["draft", "published", "archived"],
      product_type: ["ebook", "mentoria", "curso"],
      purchase_status: ["pending", "completed", "refunded", "cancelled"],
    },
  },
} as const
