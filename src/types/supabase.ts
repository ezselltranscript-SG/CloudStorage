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
      folders: {
        Row: {
          id: string
          name: string
          parent_id: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          parent_id?: string | null
          created_at?: string
          user_id?: string
        }
        Update: {
          id?: string
          name?: string
          parent_id?: string | null
          created_at?: string
          user_id?: string
        }
      }
      files: {
        Row: {
          id: string
          filename: string
          folder_id: string
          storage_path: string
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          filename: string
          folder_id: string
          storage_path: string
          created_at?: string
          user_id?: string
        }
        Update: {
          id?: string
          filename?: string
          folder_id?: string
          storage_path?: string
          created_at?: string
          user_id?: string
        }
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
  }
}
