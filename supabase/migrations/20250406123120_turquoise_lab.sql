/*
  # Schéma des Propriétés Immobilières

  1. Nouvelles Tables
    - `properties`
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, référence vers profiles)
      - `address` (text, non null)
      - `city` (text, non null)
      - `type` (text, non null)
      - `price` (numeric, non null)
      - `surface` (numeric, non null)
      - `bedrooms` (integer)
      - `description` (text)
      - `source` (text, non null)
      - `source_url` (text)
      - `created_at` (timestamp with timezone)
      - `updated_at` (timestamp with timezone)

  2. Sécurité
    - Activation RLS sur la table `properties`
    - Politiques pour :
      - Les utilisateurs peuvent lire leurs propres propriétés
      - Les utilisateurs peuvent gérer leurs propres propriétés
      - Les administrateurs peuvent tout gérer
*/

-- Création de l'enum pour les types de sources
CREATE TYPE property_source AS ENUM ('url', 'csv', 'pdf');

-- Création de l'enum pour les types de biens
CREATE TYPE property_type AS ENUM ('apartment', 'house');

-- Création de la table properties
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  address text NOT NULL,
  city text NOT NULL,
  type property_type NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  surface numeric NOT NULL CHECK (surface > 0),
  bedrooms integer CHECK (bedrooms >= 0),
  description text,
  source property_source NOT NULL,
  source_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activation de la Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Création du trigger pour la mise à jour automatique de updated_at
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Création des index pour améliorer les performances
CREATE INDEX properties_user_id_idx ON properties(user_id);
CREATE INDEX properties_city_idx ON properties(city);
CREATE INDEX properties_type_idx ON properties(type);
CREATE INDEX properties_price_idx ON properties(price);

-- Politiques de sécurité

-- Les utilisateurs peuvent lire leurs propres propriétés
CREATE POLICY "Users can read own properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    is_admin(auth.uid())
  );

-- Les utilisateurs peuvent insérer leurs propres propriétés
CREATE POLICY "Users can insert own properties"
  ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

-- Les utilisateurs peuvent mettre à jour leurs propres propriétés
CREATE POLICY "Users can update own properties"
  ON properties
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    is_admin(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id OR
    is_admin(auth.uid())
  );

-- Les utilisateurs peuvent supprimer leurs propres propriétés
CREATE POLICY "Users can delete own properties"
  ON properties
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    is_admin(auth.uid())
  );