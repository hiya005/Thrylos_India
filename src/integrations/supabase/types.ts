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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_tasks: {
        Row: {
          assigned_pm_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          service_request_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_pm_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          service_request_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_pm_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          service_request_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_tasks_assigned_pm_id_fkey"
            columns: ["assigned_pm_id"]
            isOneToOne: false
            referencedRelation: "project_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_tasks_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_image_url: string | null
          author_name: string
          canonical_url: string | null
          category: string | null
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          highlights: string[]
          id: string
          is_published: boolean
          links: Json
          meta_description: string | null
          published_at: string | null
          read_time_label: string | null
          seo_title: string | null
          slug: string
          subtopic: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_image_url?: string | null
          author_name?: string
          canonical_url?: string | null
          category?: string | null
          content: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          highlights?: string[]
          id?: string
          is_published?: boolean
          links?: Json
          meta_description?: string | null
          published_at?: string | null
          read_time_label?: string | null
          seo_title?: string | null
          slug: string
          subtopic?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_image_url?: string | null
          author_name?: string
          canonical_url?: string | null
          category?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          highlights?: string[]
          id?: string
          is_published?: boolean
          links?: Json
          meta_description?: string | null
          published_at?: string | null
          read_time_label?: string | null
          seo_title?: string | null
          slug?: string
          subtopic?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      communication_logs: {
        Row: {
          created_at: string
          direction: string
          id: string
          message: string
          service_request_id: string | null
          subject: string | null
          type: string
          user_email: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          direction?: string
          id?: string
          message: string
          service_request_id?: string | null
          subject?: string | null
          type?: string
          user_email?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          direction?: string
          id?: string
          message?: string
          service_request_id?: string | null
          subject?: string | null
          type?: string
          user_email?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_logs_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean | null
          is_replied: boolean | null
          message: string
          name: string
          phone: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean | null
          is_replied?: boolean | null
          message: string
          name: string
          phone?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean | null
          is_replied?: boolean | null
          message?: string
          name?: string
          phone?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          status: string
          to_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          status?: string
          to_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          status?: string
          to_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_entity_id: string | null
          related_user_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_entity_id?: string | null
          related_user_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_entity_id?: string | null
          related_user_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      otp_verifications: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_code: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          otp_code: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          verified?: boolean
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          amount: number
          cashfree_order_id: string | null
          cashfree_payment_id: string | null
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          payment_method: string | null
          payment_note: string | null
          qr_code_url: string | null
          service_request_id: string
          status: string
          transaction_id: string | null
          updated_at: string
          upi_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          cashfree_order_id?: string | null
          cashfree_payment_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_note?: string | null
          qr_code_url?: string | null
          service_request_id: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
          upi_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          cashfree_order_id?: string | null
          cashfree_payment_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_note?: string | null
          qr_code_url?: string | null
          service_request_id?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
          upi_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          order_index: number
          project_url: string | null
          technologies: string[] | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          order_index?: number
          project_url?: string | null
          technologies?: string[] | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          order_index?: number
          project_url?: string | null
          technologies?: string[] | null
          title?: string
        }
        Relationships: []
      }
      premium_email_logs: {
        Row: {
          created_at: string
          email: string | null
          email_type: string
          feature_key: string
          id: string
          metadata: Json
          sent_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          email_type: string
          feature_key: string
          id?: string
          metadata?: Json
          sent_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          email_type?: string
          feature_key?: string
          id?: string
          metadata?: Json
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_id: string | null
          avatar_url: string | null
          company: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_banned: boolean
          is_public: boolean
          is_verified: boolean
          phone: string | null
          updated_at: string
          user_id: string
          username: string | null
          username_changed_at: string | null
          verification_type: string | null
        }
        Insert: {
          account_id?: string | null
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_banned?: boolean
          is_public?: boolean
          is_verified?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          username_changed_at?: string | null
          verification_type?: string | null
        }
        Update: {
          account_id?: string | null
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_banned?: boolean
          is_public?: boolean
          is_verified?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          username_changed_at?: string | null
          verification_type?: string | null
        }
        Relationships: []
      }
      project_managers: {
        Row: {
          bio: string | null
          created_at: string
          education: string | null
          email: string
          id: string
          is_available: boolean
          name: string
          phone: string | null
          photo_url: string | null
          portfolio_projects: string[]
          specialization: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          education?: string | null
          email: string
          id?: string
          is_available?: boolean
          name: string
          phone?: string | null
          photo_url?: string | null
          portfolio_projects?: string[]
          specialization?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          education?: string | null
          email?: string
          id?: string
          is_available?: boolean
          name?: string
          phone?: string | null
          photo_url?: string | null
          portfolio_projects?: string[]
          specialization?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          service_request_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          service_request_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          service_request_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          is_approved: boolean
          is_featured: boolean
          rating: number
          review_images: string[] | null
          review_text: string
          reviewer_avatar_url: string | null
          reviewer_name: string
          reviewer_role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_approved?: boolean
          is_featured?: boolean
          rating?: number
          review_images?: string[] | null
          review_text: string
          reviewer_avatar_url?: string | null
          reviewer_name: string
          reviewer_role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_approved?: boolean
          is_featured?: boolean
          rating?: number
          review_images?: string[] | null
          review_text?: string
          reviewer_avatar_url?: string | null
          reviewer_name?: string
          reviewer_role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      service_request_audits: {
        Row: {
          action: string
          actor_email: string | null
          actor_name: string | null
          bulk_group_id: string | null
          changed_fields: Json
          created_at: string
          editor_role: string
          editor_user_id: string
          id: string
          is_bulk: boolean
          request_snapshot: Json
          service_request_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action?: string
          actor_email?: string | null
          actor_name?: string | null
          bulk_group_id?: string | null
          changed_fields?: Json
          created_at?: string
          editor_role: string
          editor_user_id: string
          id?: string
          is_bulk?: boolean
          request_snapshot?: Json
          service_request_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_name?: string | null
          bulk_group_id?: string | null
          changed_fields?: Json
          created_at?: string
          editor_role?: string
          editor_user_id?: string
          id?: string
          is_bulk?: boolean
          request_snapshot?: Json
          service_request_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_request_audits_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          admin_response: string | null
          assigned_pm_id: string | null
          budget_range: string | null
          color_theme: string | null
          company_name: string | null
          contact_email: string | null
          contact_phone: string | null
          coupon_code: string | null
          created_at: string
          description: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          pm_assigned_at: string | null
          priority: string
          profile_showcase_requested: boolean
          project_url: string | null
          service_id: string | null
          service_type: string | null
          show_on_profile: boolean
          status: Database["public"]["Enums"]["request_status"]
          timeline: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          assigned_pm_id?: string | null
          budget_range?: string | null
          color_theme?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          coupon_code?: string | null
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          pm_assigned_at?: string | null
          priority?: string
          profile_showcase_requested?: boolean
          project_url?: string | null
          service_id?: string | null
          service_type?: string | null
          show_on_profile?: boolean
          status?: Database["public"]["Enums"]["request_status"]
          timeline?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          assigned_pm_id?: string | null
          budget_range?: string | null
          color_theme?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          coupon_code?: string | null
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          pm_assigned_at?: string | null
          priority?: string
          profile_showcase_requested?: boolean
          project_url?: string | null
          service_id?: string | null
          service_type?: string | null
          show_on_profile?: boolean
          status?: Database["public"]["Enums"]["request_status"]
          timeline?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_assigned_pm_id_fkey"
            columns: ["assigned_pm_id"]
            isOneToOne: false
            referencedRelation: "project_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          features: string[] | null
          icon: string | null
          id: string
          is_active: boolean | null
          order_index: number
          price_range: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number
          price_range?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number
          price_range?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          order_index: number
          role: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          order_index?: number
          role: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          order_index?: number
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_name: string | null
          id: string
          ip_address: string | null
          is_active: boolean
          last_seen_at: string
          os: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_name?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_seen_at?: string
          os?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_name?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_seen_at?: string
          os?: string | null
          user_id?: string
        }
        Relationships: []
      }
      verification_subscriptions: {
        Row: {
          amount: number
          cashfree_order_id: string | null
          created_at: string
          expires_at: string
          id: string
          plan_type: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          cashfree_order_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          plan_type?: string
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          cashfree_order_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          plan_type?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_contact_profiles: {
        Args: { _user_ids: string[] }
        Returns: {
          account_id: string
          avatar_url: string
          email: string
          full_name: string
          is_verified: boolean
          phone: string
          user_id: string
          username: string
          verification_type: string
        }[]
      }
      get_public_profile: {
        Args: { _slug: string }
        Returns: {
          account_id: string
          avatar_url: string
          company: string
          created_at: string
          full_name: string
          is_verified: boolean
          user_id: string
          username: string
          verification_type: string
        }[]
      }
      get_public_project_managers: {
        Args: never
        Returns: {
          bio: string
          education: string
          id: string
          is_available: boolean
          name: string
          photo_url: string
          portfolio_projects: string[]
          project_count: number
          specialization: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      queue_verification_expiry_reminders: { Args: never; Returns: number }
      search_public_profiles: {
        Args: { _limit?: number; _query?: string }
        Returns: {
          account_id: string
          avatar_url: string
          company: string
          created_at: string
          full_name: string
          is_verified: boolean
          user_id: string
          username: string
          verification_type: string
        }[]
      }
      user_has_assigned_pm: { Args: { _pm_id: string }; Returns: boolean }
      user_owns_service_request: {
        Args: { _service_request_id: string }
        Returns: boolean
      }
      validate_coupon: {
        Args: { _coupon_code: string }
        Returns: {
          code: string
          discount_type: string
          discount_value: number
          message: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      request_status: "pending" | "in_progress" | "completed" | "cancelled"
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
      app_role: ["admin", "user"],
      request_status: ["pending", "in_progress", "completed", "cancelled"],
    },
  },
} as const
