-- Drop the function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.join_quiz_session(text, text, uuid);

-- Create the function with proper security settings
CREATE OR REPLACE FUNCTION public.join_quiz_session(
  p_session_code text,
  p_username text,
  p_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session quiz_sessions;
  v_participant session_participants;
  v_existing_participant session_participants;
BEGIN
  -- Input validation
  IF p_session_code IS NULL OR p_session_code = '' THEN
    RAISE EXCEPTION 'Session code cannot be empty';
  END IF;
  
  IF p_username IS NULL OR p_username = '' THEN
    RAISE EXCEPTION 'Username cannot be empty';
  END IF;
  
  -- Start transaction
  BEGIN
    -- Get the session and lock it for update
    SELECT *
    INTO v_session
    FROM quiz_sessions
    WHERE session_code = p_session_code
    FOR UPDATE;
    
    -- Check if session exists and is in waiting status
    IF v_session IS NULL THEN
      RAISE EXCEPTION 'Session not found with code: %', p_session_code;
    END IF;
    
    IF v_session.status != 'waiting' THEN
      RAISE EXCEPTION 'Session % is not in waiting status (current status: %)', 
        v_session.id, v_session.status;
    END IF;
    
    -- Check if user is already in the session
    SELECT *
    INTO v_existing_participant
    FROM session_participants
    WHERE session_id = v_session.id
    AND (user_id = p_user_id OR username = p_username);
    
    IF v_existing_participant IS NOT NULL THEN
      RAISE EXCEPTION 'User is already in this session';
    END IF;
    
    -- Insert participant
    INSERT INTO session_participants (
      session_id,
      user_id,
      username,
      score,
      completed,
      answers,
      joined_at
    )
    VALUES (
      v_session.id,
      p_user_id,
      p_username,
      0,
      false,
      '[]'::jsonb,
      NOW()
    )
    RETURNING * INTO v_participant;
    
    -- Return both session and participant data
    RETURN json_build_object(
      'session', row_to_json(v_session),
      'participant', row_to_json(v_participant)
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback will happen automatically
      RAISE;
  END;
END;
$$; 