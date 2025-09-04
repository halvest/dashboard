/*
  # Create hki table for IPR management

  1. New Tables
    - `hki`
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
    - Enable RLS on `hki` table
    - Add policies for admin users only

  3. Constraints
    - Unique constraint on nama_hki
    - Check constraint for jenis_hki values
    - Check constraint for status values
*/

-- Create hki table
CREATE TABLE IF NOT EXISTS hki (
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
ALTER TABLE hki ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Admin users can read all hki"
  ON hki
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admin users can insert hki"
  ON hki
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admin users can update hki"
  ON hki
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admin users can delete hki"
  ON hki
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_hki_updated_at
  BEFORE UPDATE ON hki
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hki_jenis_hki ON hki(jenis_hki);
CREATE INDEX IF NOT EXISTS idx_hki_status ON hki(status);
CREATE INDEX IF NOT EXISTS idx_hki_fasilitasi_tahun ON hki(fasilitasi_tahun);
CREATE INDEX IF NOT EXISTS idx_hki_nama_pemohon ON hki(nama_pemohon);
CREATE INDEX IF NOT EXISTS idx_hki_created_at ON hki(created_at);