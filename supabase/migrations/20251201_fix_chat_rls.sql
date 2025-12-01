-- Fix RLS policies for chat_messages to allow all authenticated users to chat

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Members can manage chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Members manage chat messages" ON chat_messages; -- Drop potential old alias

-- 1. Allow all authenticated users to INSERT messages
-- We verify that the user_email matches the authenticated user's email to prevent spoofing
CREATE POLICY "Authenticated users can insert chat messages" ON chat_messages
  FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND (
      user_email = (auth.jwt() ->> 'email')
      OR public.is_superuser()
    )
  );

-- 2. Allow members and authors to UPDATE messages
CREATE POLICY "Members and authors can update chat messages" ON chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = chat_messages.object_id AND om.user_id = auth.uid()
    )
    OR user_email = (auth.jwt() ->> 'email')
    OR public.is_superuser()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = chat_messages.object_id AND om.user_id = auth.uid()
    )
    OR user_email = (auth.jwt() ->> 'email')
    OR public.is_superuser()
  );

-- 3. Allow members and authors to DELETE messages
CREATE POLICY "Members and authors can delete chat messages" ON chat_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = chat_messages.object_id AND om.user_id = auth.uid()
    )
    OR user_email = (auth.jwt() ->> 'email')
    OR public.is_superuser()
  );
