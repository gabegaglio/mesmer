-- Test Script for Sound Presets Database Schema
-- Run this after setting up the main schema to verify everything works

-- ============================================================================
-- VERIFICATION TESTS
-- ============================================================================

-- Test 1: Verify all tables exist
SELECT 'Testing table creation...' AS test_status;

SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('sounds', 'sound_presets', 'preset_sounds') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('sounds', 'sound_presets', 'preset_sounds')
ORDER BY table_name;

-- Test 2: Verify indexes exist
SELECT 'Testing indexes...' AS test_status;

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('sounds', 'sound_presets', 'preset_sounds')
ORDER BY tablename, indexname;

-- Test 3: Verify storage bucket exists
SELECT 'Testing storage bucket...' AS test_status;

SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  CASE 
    WHEN id = 'user-sounds' THEN '✅ BUCKET EXISTS'
    ELSE '❌ BUCKET MISSING'
  END AS status
FROM storage.buckets 
WHERE id = 'user-sounds';

-- Test 4: Verify RLS is enabled
SELECT 'Testing Row Level Security...' AS test_status;

SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS ENABLED'
    ELSE '❌ RLS DISABLED'
  END AS status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('sounds', 'sound_presets', 'preset_sounds')
ORDER BY tablename;

-- Test 5: Verify policies exist
SELECT 'Testing RLS policies...' AS test_status;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE 
    WHEN policyname IS NOT NULL THEN '✅ POLICY EXISTS'
    ELSE '❌ NO POLICIES'
  END AS status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('sounds', 'sound_presets', 'preset_sounds')
ORDER BY tablename, policyname;

-- Test 6: Verify triggers exist
SELECT 'Testing triggers...' AS test_status;

SELECT 
  trigger_schema,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  CASE 
    WHEN trigger_name IS NOT NULL THEN '✅ TRIGGER EXISTS'
    ELSE '❌ NO TRIGGERS'
  END AS status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('sounds', 'sound_presets')
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- SAMPLE DATA TESTS (Optional - for testing purposes only)
-- ============================================================================

-- Note: These tests require a valid user to be authenticated
-- Only run these if you want to test with sample data

-- Test 7: Test inserting sample data (requires authenticated user)
/*
-- Sample sound preset
INSERT INTO public.sound_presets (user_id, name, description) 
VALUES (auth.uid(), 'Test Preset', 'A test preset for validation');

-- Sample custom sound
INSERT INTO public.sounds (user_id, name, file_path, file_size, file_type, category) 
VALUES (
  auth.uid(), 
  'Test Sound', 
  'test/sample.mp3', 
  1024000, 
  'audio/mpeg', 
  'Custom'
);

-- Sample preset-sound relationship
INSERT INTO public.preset_sounds (preset_id, sound_key, volume, sort_order)
VALUES (
  (SELECT id FROM public.sound_presets WHERE name = 'Test Preset' LIMIT 1),
  'ocean',
  0.75,
  1
);
*/

-- ============================================================================
-- CLEANUP TEST DATA (Optional)
-- ============================================================================

-- Uncomment these lines to clean up test data
/*
DELETE FROM public.preset_sounds WHERE preset_id IN (
  SELECT id FROM public.sound_presets WHERE name = 'Test Preset'
);
DELETE FROM public.sounds WHERE name = 'Test Sound';
DELETE FROM public.sound_presets WHERE name = 'Test Preset';
*/

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

SELECT 'Schema setup verification complete!' AS test_status;

-- Count all relevant objects
SELECT 
  'SUMMARY' AS category,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('sounds', 'sound_presets', 'preset_sounds')) AS tables_created,
  (SELECT COUNT(*) FROM pg_indexes 
   WHERE schemaname = 'public' 
   AND tablename IN ('sounds', 'sound_presets', 'preset_sounds')) AS indexes_created,
  (SELECT COUNT(*) FROM storage.buckets WHERE id = 'user-sounds') AS buckets_created,
  (SELECT COUNT(*) FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename IN ('sounds', 'sound_presets', 'preset_sounds')) AS policies_created; 