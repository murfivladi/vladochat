-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', 'Utente'),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update chat updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_chat_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.chats 
  SET updated_at = NOW() 
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$;

-- Trigger to update chat timestamp when new message is sent
DROP TRIGGER IF EXISTS update_chat_on_message ON public.messages;
CREATE TRIGGER update_chat_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_timestamp();

-- Function to create direct chat between users
CREATE OR REPLACE FUNCTION public.create_direct_chat(other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  chat_id UUID;
  existing_chat_id UUID;
BEGIN
  -- Check if direct chat already exists
  SELECT c.id INTO existing_chat_id
  FROM public.chats c
  JOIN public.chat_participants cp1 ON c.id = cp1.chat_id
  JOIN public.chat_participants cp2 ON c.id = cp2.chat_id
  WHERE c.type = 'direct'
    AND cp1.user_id = auth.uid()
    AND cp2.user_id = other_user_id
    AND cp1.user_id != cp2.user_id;
  
  IF existing_chat_id IS NOT NULL THEN
    RETURN existing_chat_id;
  END IF;
  
  -- Create new direct chat
  INSERT INTO public.chats (type, created_by)
  VALUES ('direct', auth.uid())
  RETURNING id INTO chat_id;
  
  -- Add both participants
  INSERT INTO public.chat_participants (chat_id, user_id, role)
  VALUES 
    (chat_id, auth.uid(), 'admin'),
    (chat_id, other_user_id, 'admin');
  
  RETURN chat_id;
END;
$$;
