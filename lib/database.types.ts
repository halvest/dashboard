export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Tipe untuk data yang akan dikembalikan oleh RPC
type FormOptionsData = {
  jenis_options: { id_jenis_hki: number; nama_jenis_hki: string; is_active: boolean }[];
  status_options: { id_status: number; nama_status: string }[];
  tahun_options: { tahun: number }[];
  pengusul_options: { id_pengusul: number; nama_opd: string }[];
  kelas_options: { id_kelas: number; nama_kelas: string; tipe: string; is_active: boolean; nomor_kelas: number }[];
}

// Tipe untuk RPC statistik dashboard
type DashboardStatsData = {
  total_hki: number;
  diterima_terdaftar: number;
  diproses: number;
  ditolak: number;
}

export type Database = {
  public: {
    Tables: {
      hki: {
        Row: {
          created_at: string | null
          id_hki: number
          id_jenis_hki: number
          id_kelas: number | null
          id_pemohon: number
          id_pengusul: number
          id_status: number
          jenis_produk: string | null
          keterangan: string | null
          nama_hki: string
          sertifikat_pdf: string | null
          tahun_fasilitasi: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id_hki?: number
          id_jenis_hki: number
          id_kelas?: number | null
          id_pemohon: number
          id_pengusul: number
          id_status: number
          jenis_produk?: string | null
          keterangan?: string | null
          nama_hki: string
          sertifikat_pdf?: string | null
          tahun_fasilitasi?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id_hki?: number
          id_jenis_hki?: number
          id_kelas?: number | null
          id_pemohon?: number
          id_pengusul?: number
          id_status?: number
          jenis_produk?: string | null
          keterangan?: string | null
          nama_hki?: string
          sertifikat_pdf?: string | null
          tahun_fasilitasi?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hki_id_jenis_hki_fkey"
            columns: ["id_jenis_hki"]
            isOneToOne: false
            referencedRelation: "jenis_hki"
            referencedColumns: ["id_jenis_hki"]
          },
          {
            foreignKeyName: "hki_id_kelas_fkey"
            columns: ["id_kelas"]
            isOneToOne: false
            referencedRelation: "kelas_hki"
            referencedColumns: ["id_kelas"]
          },
          {
            foreignKeyName: "hki_id_pemohon_fkey"
            columns: ["id_pemohon"]
            isOneToOne: false
            referencedRelation: "pemohon"
            referencedColumns: ["id_pemohon"]
          },
          {
            foreignKeyName: "hki_id_pengusul_fkey"
            columns: ["id_pengusul"]
            isOneToOne: false
            referencedRelation: "pengusul"
            referencedColumns: ["id_pengusul"]
          },
          {
            foreignKeyName: "hki_id_status_fkey"
            columns: ["id_status"]
            isOneToOne: false
            referencedRelation: "status_hki"
            referencedColumns: ["id_status"]
          },
        ]
      }
      jenis_hki: {
        Row: { id_jenis_hki: number; nama_jenis_hki: string; is_active: boolean }
        Insert: { id_jenis_hki?: number; nama_jenis_hki: string; is_active?: boolean }
        Update: { id_jenis_hki?: number; nama_jenis_hki?: string; is_active?: boolean }
        Relationships: []
      }
      kelas_hki: {
        Row: { id_kelas: number; nama_kelas: string; tipe: string; is_active: boolean; nomor_kelas: number }
        Insert: { id_kelas?: number; nama_kelas: string; tipe: string; is_active?: boolean; nomor_kelas: number }
        Update: { id_kelas?: number; nama_kelas?: string; tipe?: string; is_active?: boolean; nomor_kelas?: number }
        Relationships: []
      }
      pemohon: {
        Row: { alamat: string | null; id_pemohon: number; nama_pemohon: string }
        Insert: { alamat?: string | null; id_pemohon?: number; nama_pemohon: string }
        Update: { alamat?: string | null; id_pemohon?: number; nama_pemohon?: string }
        Relationships: []
      }
      pengusul: {
        Row: { id_pengusul: number; nama_opd: string }
        Insert: { id_pengusul?: number; nama_opd: string }
        Update: { id_pengusul?: number; nama_opd?: string }
        Relationships: []
      }
      profiles: {
        Row: { avatar_url: string | null; created_at: string | null; email: string | null; full_name: string | null; id: string; role: string | null; updated_at: string | null }
        Insert: { avatar_url?: string | null; created_at?: string | null; email?: string | null; full_name?: string | null; id: string; role?: string | null; updated_at?: string | null }
        Update: { avatar_url?: string | null; created_at?: string | null; email?: string | null; full_name?: string | null; id?: string; role?: string | null; updated_at?: string | null }
        Relationships: [{ foreignKeyName: "profiles_id_fkey"; columns: ["id"]; isOneToOne: true; referencedRelation: "users"; referencedColumns: ["id"] }]
      }
      status_hki: {
        Row: { id_status: number; nama_status: string }
        Insert: { id_status?: number; nama_status: string }
        Update: { id_status?: number; nama_status: string }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_all_form_options: {
        Args: Record<PropertyKey, never>
        Returns: FormOptionsData
      }
      get_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: DashboardStatsData
      }
      get_distinct_hki_years: {
        Args: Record<PropertyKey, never>
        Returns: { tahun_fasilitasi: number }[]
      }
      get_hki_report_summary: {
        Args: {
          p_year: number | null
          p_status_id: number | null
        }
        Returns: unknown
      }
      search_hki_ids_with_count: {
        Args: {
          p_search_text: string
          p_jenis_id: number
          p_status_id: number
          p_year: number
          p_pengusul_id: number
        }
        Returns: { result_id: number; result_count: number }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
