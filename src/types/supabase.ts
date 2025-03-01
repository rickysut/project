export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string
          created_at: string
          email: string
          name: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          name?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admins_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      jemaat: {
        Row: {
          id: string
          created_at: string
          full_name: string
          address: string | null
          phone: string | null
          email: string | null
          birthday: string | null
          gender: string | null
          age: number | null
          photo: number | null
          registered_by: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          full_name: string
          address?: string | null
          phone?: string | null
          email?: string | null
          birthday?: string | null
          gender?: string | null
          age: number | null
          photo: number | null
          registered_by: number | null
        }
        Update: {
          id?: string
          created_at?: string
          full_name?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          birthday?: string | null
          gender?: string | null
          age: number | null
          photo: number | null
          registered_by: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}