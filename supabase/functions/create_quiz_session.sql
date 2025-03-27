-- Drop the function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.create_quiz_session(uuid, uuid);

-- Create the function with proper security settings
CREATE OR REPLACE FUNCTION public.create_quiz_session(
  p_quiz_id uuid,
  p_creator_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session quiz_sessions;
  v_session_code text;
BEGIN
  -- Input validation
  IF p_quiz_id IS NULL THEN
    RAISE EXCEPTION 'Quiz ID cannot be empty';
  END IF;
  
  -- Generate a random 6-character session code
  v_session_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));
  
  -- Start transaction
  BEGIN
    -- Check if the quiz exists
    IF NOT EXISTS (SELECT 1 FROM quizzes WHERE id = p_quiz_id) THEN
      RAISE EXCEPTION 'Quiz with ID % does not exist', p_quiz_id;
    END IF;
    
    -- Insert the new session
    INSERT INTO quiz_sessions (
      quiz_id,
      creator_id,
      session_code,
      status,
      settings,
      created_at
    )
    VALUES (
      p_quiz_id,
      p_creator_id,
      v_session_code,
      'waiting',
      '{}',
      NOW()
    )
    RETURNING * INTO v_session;
    
    -- Return the session data
    RETURN json_build_object(
      'id', v_session.id,
      'quiz_id', v_session.quiz_id,
      'creator_id', v_session.creator_id,
      'session_code', v_session.session_code,
      'status', v_session.status,
      'created_at', v_session.created_at,
      'settings', v_session.settings
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to create quiz session: %', SQLERRM;
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_quiz_session(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_quiz_session(uuid, uuid) TO service_role; 