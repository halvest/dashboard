/*
  # Create hki_entries table for IPR management

  1. New Tables
    - `hki_entries`
      - `id` (uuid, primary key)
      - `nama_hki` (text, unique, required)
      - `jenis_hki` (text, required, enum values)
      - `nama_pemohon` (text, required)
      - `nomor_permohonan` (text, required)
      - `tanggal_permohonan` (date, required)
      - `status` (text, required, enum values)
      - `fasilitasi_tahun` (integer, required)
      - `sertifikat_path` (text, optional)
      - `keterangan` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `hki_entries` table
    - Add policies for admin users only

  3. Constraints
    - Unique constraint on nama_hki
    - Check constraint for jenis_hki values
    - Check constraint for status values
*/

-- Create hki_entries table
CREATE TABLE IF NOT EXISTS hki_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_hki text UNIQUE NOT NULL,
  jenis_hki text NOT NULL CHECK (jenis_hki IN ('Merek', 'Hak Cipta', 'Paten', 'Paten Sederhana', 'Indikasi Geografis')),
  nama_pemohon text NOT NULL,
  nomor_permohonan text NOT NULL,
  tanggal_permohonan date NOT NULL,
  status text NOT NULL CHECK (status IN ('Diterima', 'Didaftar', 'Ditolak', 'Dalam Proses')),
  fasilitasi_tahun integer NOT NULL,
  sertifikat_path text,
  keterangan text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE hki_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Admin users can read all hki_entries"
  ON hki_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admin users can insert hki_entries"
  ON hki_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admin users can update hki_entries"
  ON hki_entries
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admin users can delete hki_entries"
  ON hki_entries
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_hki_entries_updated_at
  BEFORE UPDATE ON hki_entries
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hki_entries_jenis_hki ON hki_entries(jenis_hki);
CREATE INDEX IF NOT EXISTS idx_hki_entries_status ON hki_entries(status);
CREATE INDEX IF NOT EXISTS idx_hki_entries_fasilitasi_tahun ON hki_entries(fasilitasi_tahun);
CREATE INDEX IF NOT EXISTS idx_hki_entries_nama_pemohon ON hki_entries(nama_pemohon);
CREATE INDEX IF NOT EXISTS idx_hki_entries_created_at ON hki_entries(created_at);