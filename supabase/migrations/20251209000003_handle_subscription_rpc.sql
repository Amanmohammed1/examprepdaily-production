-- Function to handle new subscriptions securely (bypassing RLS)
CREATE OR REPLACE FUNCTION public.handle_new_subscription(
    p_email TEXT,
    p_selected_exams public.exam_type[]
)
RETURNS TABLE (
    status TEXT,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with admin privileges to bypass RLS
AS $$
DECLARE
    v_existing_exams public.exam_type[];
    v_merged_exams public.exam_type[];
    v_verification_token UUID := gen_random_uuid();
BEGIN
    -- Check if user exists
    SELECT selected_exams INTO v_existing_exams
    FROM public.subscribers
    WHERE email = p_email;

    IF FOUND THEN
        -- Merge existing exams with new ones (deduplicate)
        -- Array concat then unnest/distinct/array_agg is the clean way in SQL
        SELECT ARRAY(
            SELECT DISTINCT unnest(v_existing_exams || p_selected_exams)
        )::public.exam_type[] INTO v_merged_exams;

        -- Update subscriber
        UPDATE public.subscribers
        SET selected_exams = v_merged_exams
        WHERE email = p_email;

        RETURN QUERY SELECT 'updated'::TEXT, 'Subscription updated with new preferences.'::TEXT;
    ELSE
        -- Insert new subscriber
        INSERT INTO public.subscribers (email, selected_exams, verification_token, is_verified, is_active)
        VALUES (p_email, p_selected_exams, v_verification_token, true, true);

        RETURN QUERY SELECT 'inserted'::TEXT, 'New subscription successful.'::TEXT;
    END IF;
END;
$$;
